import type { Boom } from "@hapi/boom";
import makeWASocket, {
  AuthenticationState,
  ConnectionState,
  DisconnectReason,
  WASocket,
} from "baileys";
import { pino } from "pino";
import QRCode from "qrcode";

import {
  WaClientLoggedOutError,
  WaClientNotReadyError,
  WaClientUnexpectedError,
} from "@/errors/appErrors";
import { AUTH_DATA_DIR, LOG_LEVEL } from "@/global/config";
import { logger } from "@/global/logger";
import { WhatsappClient } from "@/types";

import { createLevelDbAuthStore } from "./levelDbAuthStore";

enum SocketStatus {
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  SCAN_QR = "SCAN_QR",
  ERROR = "ERROR",
  ERROR_CONNECTION_CLOSED = "ERROR_CONNECTION_CLOSED",
  ERROR_CONNECTION_LOST = "ERROR_CONNECTION_LOST",
  ERROR_CONNECTION_REPLACED = "ERROR_CONNECTION_REPLACED",
  ERROR_TIMED_OUT = "ERROR_TIMED_OUT",
}

const errorMapping = new Map<DisconnectReason, SocketStatus>([
  [DisconnectReason.connectionClosed, SocketStatus.ERROR_CONNECTION_CLOSED],
  [DisconnectReason.connectionLost, SocketStatus.ERROR_CONNECTION_LOST],
  [DisconnectReason.connectionReplaced, SocketStatus.ERROR_CONNECTION_REPLACED],
  [DisconnectReason.timedOut, SocketStatus.ERROR_TIMED_OUT],
]);

export interface BaileysAuthStore {
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
  clear: () => Promise<void>;
}

export const createBaileysClient = (): WhatsappClient => {
  let sock: WASocket | undefined;
  let authStore: BaileysAuthStore;
  let status = SocketStatus.CONNECTING;

  (async () => {
    authStore = await createLevelDbAuthStore(AUTH_DATA_DIR);
    if (!sock) sock = await createSocket();
  })();

  async function createSocket() {
    sock = makeWASocket({
      auth: authStore.state,
      logger: pino({
        level:
          LOG_LEVEL === "trace" || LOG_LEVEL === "debug" ? LOG_LEVEL : "error",
      }),
    });

    sock.ev.on("creds.update", authStore.saveCreds);
    sock.ev.on("connection.update", handleConnectionUpdate);

    return sock;
  }

  async function handleConnectionUpdate(state: Partial<ConnectionState>) {
    if (state.qr) {
      console.log(
        await QRCode.toString(state.qr, {
          type: "terminal",
          errorCorrectionLevel: "L",
          small: true,
        }),
      );
      status = SocketStatus.SCAN_QR;

      return;
    }

    if (state.connection === "open") {
      logger.info("Connected to WhatsApp");
      status = SocketStatus.CONNECTED;
    }

    if (state.connection === "connecting") {
      status = SocketStatus.CONNECTING;
    }

    if (state.connection !== "close") return;

    const err = state.lastDisconnect?.error as Boom;
    const statusCode = err.output.statusCode;

    status = SocketStatus.ERROR;

    if (statusCode === DisconnectReason.loggedOut) {
      logger.fatal("Logged Out");
      logger.info("Deleting whatsapp auth state");

      await authStore.clear();
    }

    if (errorMapping.has(statusCode)) {
      status = errorMapping.get(statusCode) as SocketStatus;
    }

    logger.info("Restarting");

    // setTimeout prevents recursion
    setTimeout(createSocket, 0);
  }

  return {
    getHealth() {
      if (status === SocketStatus.CONNECTING) {
        throw new WaClientNotReadyError(
          "Client is still connecting to WhatsApp.",
        );
      }

      if (status === SocketStatus.SCAN_QR) {
        throw new WaClientLoggedOutError(
          "Logged out of WhatsApp. Please login using the QR.",
        );
      }

      if (status === SocketStatus.ERROR_CONNECTION_LOST) {
        throw new WaClientUnexpectedError(
          "Connection lost while trying to connect to WhatsApp.",
        );
      }

      if (status === SocketStatus.ERROR_CONNECTION_CLOSED) {
        throw new WaClientUnexpectedError(
          "Connection closed while trying to connect to WhatsApp.",
        );
      }
      if (status === SocketStatus.ERROR_CONNECTION_REPLACED) {
        throw new WaClientUnexpectedError(
          "Connection replaced while trying to connect to WhatsApp.",
        );
      }
      if (status === SocketStatus.ERROR_TIMED_OUT) {
        throw new WaClientUnexpectedError("WhatsApp connection timed out.");
      }

      if (status === SocketStatus.ERROR) {
        throw new WaClientUnexpectedError(
          `There was an unexpected error while connecting to WhatsApp.`,
        );
      }

      return status === SocketStatus.CONNECTED;
    },

    async sendMessage(chat, msg) {
      try {
        await sock?.sendMessage(chat, {
          text:
            msg.title.length > 0
              ? `*${msg.title}*\n${msg.message}`
              : msg.message,
        });

        for (const file of msg.attachments) {
          await sock?.sendMessage(chat, {
            mimetype: file.mimetype,
            fileName: file.filename,
            document: file.buffer,
          });
        }
      } catch (err) {
        if (err instanceof Error) {
          logger.error(err);

          throw new Error("Could not send message via Whatsapp");
        }
      }
    },
  };
};

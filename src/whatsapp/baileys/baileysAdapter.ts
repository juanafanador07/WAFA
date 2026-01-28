import EventEmitter from "node:events";

import type { Boom } from "@hapi/boom";
import makeWASocket, {
  AuthenticationState,
  ConnectionState,
  DisconnectReason,
  WASocket,
} from "baileys";
import { pino } from "pino";
import QRCode from "qrcode";
import z from "zod";

import {
  WaClientLoggedOutError,
  WaClientNotReadyError,
  WaClientUnexpectedError,
} from "@/errors/appErrors";
import { AUTH_DATA_DIR, LOG_LEVEL } from "@/global/config";
import { logger } from "@/global/logger";
import { ClientEventMap, WhatsappClient } from "@/types";

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
  const events = new EventEmitter<ClientEventMap>();

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

    const msgSchema = z.object({
      chat: z.string(),
      fromMe: z.boolean(),
      text: z.string(),
    });

    sock.ev.on("messages.upsert", ({ type, messages }) => {
      if (type !== "notify") {
        return;
      }

      for (const msg of messages) {
        const chat = msg.key.remoteJid || msg.key.remoteJidAlt;

        const { success, data } = msgSchema.safeParse({
          chat,
          fromMe: msg.key.fromMe || chat?.endsWith("newsletter"),
          text:
            msg.message?.conversation || msg.message?.extendedTextMessage?.text,
        });

        if (!success) {
          logger.warn(msg, "Ignored message due to invalid schema");
          return;
        }

        events.emit("message", data);
      }
    });

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
    events,
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

    async sendMessage({ chat, text, attachment }) {
      try {
        if (!attachment) {
          await sock?.sendMessage(chat, {
            text,
          });

          return;
        }

        await sock?.sendMessage(chat, {
          caption: text.length > 0 ? text : undefined,
          mimetype: attachment.mimetype,
          fileName: attachment.filename,
          document: attachment.buffer,
        });
      } catch (err) {
        if (err instanceof Error) {
          logger.error(err);

          throw new WaClientUnexpectedError(
            "Could not send message via Whatsapp",
          );
        }
      }
    },
  };
};

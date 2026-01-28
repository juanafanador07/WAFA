import { logger } from "@/global/logger";
import { WhatsappClient } from "@/types";

import { getChatIdCommand } from "./getChatIdCommand";

export default function createCommandsListener(client: WhatsappClient) {
  const cmdMap = new Map([["chat-id", getChatIdCommand]]);
  const regex = /^\/([0-9a-zA-Z-]+)/;

  client.events.on("message", (msg) => {
    if (!msg.fromMe) return;

    const matches = regex.exec(msg.text);
    if (!matches) return;

    const command = matches[1].toLowerCase();

    const cmdFn = cmdMap.get(command);

    if (!cmdFn) return;

    logger.info(msg, `Matched command /${command}`);

    cmdFn(client, msg);
  });
}

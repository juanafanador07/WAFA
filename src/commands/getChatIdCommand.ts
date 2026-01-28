import { Message, WhatsappClient } from "@/types";

export async function getChatIdCommand(client: WhatsappClient, msg: Message) {
  await client.sendMessage({
    chat: msg.chat,
    text: `This chat id is \`${msg.chat}\``,
  });
}

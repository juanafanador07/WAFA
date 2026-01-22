export interface WhatsappClient {
  getHealth(): boolean;
  sendMessage(chat: string, msg: Message): Promise<void>;
}

export type Message = {
  title: string;
  message: string;
  attachments: Attachment[];
};

type Attachment = {
  filename: string;
  buffer: Buffer;
  mimetype: string;
};

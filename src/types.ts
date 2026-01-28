import EventEmitter from "node:events";

export interface WhatsappClient {
  events: EventEmitter<ClientEventMap>;
  getHealth(): boolean;
  sendMessage(msg: Omit<Message, "fromMe">): Promise<void>;
}

export type Message = {
  chat: string;
  fromMe: boolean;
  text: string;
  attachment?: Attachment;
};

type Attachment = {
  filename: string;
  buffer: Buffer;
  mimetype: string;
};

export type ClientEventMap = {
  message: [Message];
};

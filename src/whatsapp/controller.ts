import { Request, Response } from "express";
import z from "zod";

import { logger } from "@/global/logger";
import { WhatsappClient } from "@/whatsapp/types";

const MessageReq = z.object({
  title: z.string(),
  message: z.string(),
  attachments: z.array(
    z
      .object({
        filename: z.string(),
        base64: z.string(),
        mimetype: z.string(),
      })
      .transform((obj) => ({
        filename: obj.filename,
        mimetype: obj.mimetype,
        buffer: Buffer.from(obj.base64, "base64"),
      })),
  ),
  chats: z.string().transform((val) => val.split(",")),
});

export const createNotificationController = (client: WhatsappClient) => ({
  async getHealth(_req: Request, res: Response) {
    client.getHealth();

    return res.json({
      status: "UP",
    });
  },

  async sendMessage(req: Request, res: Response) {
    client.getHealth();

    const data = MessageReq.parse(req.body);

    logger.info(data);

    await Promise.all(
      data.chats.map((chat) => {
        return client.sendMessage(chat, data);
      }),
    );

    return res.json({
      message: "Notification sent",
    });
  },
});

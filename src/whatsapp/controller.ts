import { Request, Response } from "express";
import z from "zod";

import { logger } from "@/global/logger";
import { WhatsappClient } from "@/types";

import { mdToWhatsapp } from "./markdown";

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

  async sendNotification(req: Request, res: Response) {
    client.getHealth();

    const data = MessageReq.parse(req.body);

    logger.info(data, "Sending Notification");

    const text = await mdToWhatsapp(
      data.title.length > 0
        ? `**${data.title}**\n${data.message}`
        : data.message,
    );

    await Promise.all(
      data.chats.map(async (chat) => {
        await client.sendMessage({
          chat,
          text,
          attachment: data.attachments[0],
        });

        if (data.attachments.length > 1) {
          for (let i = 1; i < data.attachments.length; i++) {
            await client.sendMessage({
              chat,
              text: "",
              attachment: data.attachments[i],
            });
          }
        }
      }),
    );

    return res.json({
      message: "Notification sent",
    });
  },
});

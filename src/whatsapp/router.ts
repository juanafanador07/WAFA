import { Router } from "express";

import { WhatsappClient } from "@/types";
import { createNotificationController } from "@/whatsapp/controller";

export function createNotificationRouter(client: WhatsappClient) {
  const router = Router();
  const controller = createNotificationController(client);

  router.post("/", controller.sendNotification);
  router.get("/health", controller.getHealth);

  return router;
}

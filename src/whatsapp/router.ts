import { Router } from "express";

import { createBaileysClient } from "@/whatsapp/baileys/baileysAdapter";
import { createNotificationController } from "@/whatsapp/controller";

const router = Router();
const client = createBaileysClient();
const controller = createNotificationController(client);

router.post("/", controller.sendMessage);
router.get("/health", controller.getHealth);

export { router as notificationRouter };

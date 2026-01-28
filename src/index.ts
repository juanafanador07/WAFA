import createCommandsListener from "@/commands";
import config from "@/global/config";
import { logger } from "@/global/logger";
import { createServer } from "@/server";
import { createBaileysClient } from "@/whatsapp/baileys/baileysAdapter";

logger.debug(config, "Loaded config");

const client = createBaileysClient();

createServer(client);
createCommandsListener(client);

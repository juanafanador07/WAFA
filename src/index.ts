import createCommandsListener from "@/commands";
import config, { AUTH_DATA_DIR } from "@/global/config";
import { logger } from "@/global/logger";
import { createServer } from "@/server";
import { createBaileysClient } from "@/whatsapp/baileys/baileysAdapter";
import { createLevelDbAuthStore } from "@/whatsapp/baileys/levelDbAuthStore";

logger.debug(config, "Loaded config");

(async () => {
  const authStore = await createLevelDbAuthStore(AUTH_DATA_DIR);
  const client = await createBaileysClient(authStore);

  createServer(client);
  createCommandsListener(client);
})();

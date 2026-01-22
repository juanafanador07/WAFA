import config from "@/global/config";
import { logger } from "@/global/logger";
import "@/server";

logger.debug(config, "Loaded config");

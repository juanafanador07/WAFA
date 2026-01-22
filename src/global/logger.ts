import pino from "pino";

import { LOG_LEVEL } from "./config";

export const logger = pino({
  base: undefined,
  level: LOG_LEVEL,
});

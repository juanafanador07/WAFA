import "dotenv/config";
import { Level } from "pino";

export const PORT = process.env.PORT || 3000;

export const LOG_LEVEL: Level = (
  ["trace", "debug", "info", "warn", "error", "fatal"] as Level[]
).includes(process.env.LOG_LEVEL as Level)
  ? (process.env.LOG_LEVEL as Level)
  : "info";

export const MAX_BODY_SIZE = process.env.MAX_BODY_SIZE || "10mb";

export const NODE_ENV =
  process.env.NODE_ENV === "production" ? "production" : "development";

export default {
  PORT,
  LOG_LEVEL,
  MAX_BODY_SIZE,
  NODE_ENV,
};

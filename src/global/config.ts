import "dotenv/config";
import z from "zod";

const envSchema = z.object({
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
  PORT: z.coerce.number().int().min(0).max(65535).default(3000),
  LISTEN_INTERFACE: z.union([z.ipv4(), z.ipv6()]).default("127.0.0.1"),
  MAX_BODY_SIZE: z.union([z.string(), z.number()]).default("10mb"),
  AUTH_DATA_DIR: z.string().default("./data"),
});

const env = envSchema.parse(process.env);

export default env;
export const {
  LOG_LEVEL,
  PORT,
  LISTEN_INTERFACE,
  MAX_BODY_SIZE,
  AUTH_DATA_DIR,
} = env;

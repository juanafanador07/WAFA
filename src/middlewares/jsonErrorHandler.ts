import { NextFunction, Request, Response } from "express";
import z from "zod";

import { PayloadTooLargeError, ValidationError } from "@/errors/appErrors";

const ExpressErrorSchema = z.object({
  type: z.string(),
  message: z.string(),
  stack: z.unknown(),
  expose: z.boolean(),
  statusCode: z.number(),
  status: z.number(),
});

const PayloadTooLargeErrorSchema = ExpressErrorSchema.extend({
  type: z.literal("entity.too.large"),
  expected: z.number(),
  length: z.number(),
  limit: z.number(),
});

const JSONParseErrorSchema = ExpressErrorSchema.extend({
  type: z.literal("entity.parse.failed"),
  body: z.string(),
});

export const jsonErrorHandler = (
  err: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const payloadErr = PayloadTooLargeErrorSchema.safeParse(err);
  if (payloadErr.success) {
    return next(
      new PayloadTooLargeError(
        `The request body is ${payloadErr.data.length} bytes, which exceeds the max of ${payloadErr.data.limit} bytes.`,
      ),
    );
  }

  const parseErr = JSONParseErrorSchema.safeParse(err);

  if (parseErr.success) {
    return next(new ValidationError(`${parseErr.data.message}`));
  }

  next(err);
};

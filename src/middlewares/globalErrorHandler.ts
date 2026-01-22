import { NextFunction, Request, Response } from "express";

import {
  AppError,
  PayloadTooLargeError,
  ValidationError,
  WaClientLoggedOutError,
  WaClientNotReadyError,
  WaClientUnexpectedError,
} from "@/errors/appErrors";
import { logger } from "@/global/logger";

interface ApiError {
  type: string;
  title: string;
  detail: string;
  status: number;
  [key: string]: unknown;
}

export const globalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response<ApiError>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) => {
  logger.error(err);

  const json: ApiError = {
    status: 500,
    type: "unknown-error",
    title: "Unknown error",
    detail: "Internal server error caused by an unhandled exception",
  };

  if (err instanceof ValidationError) {
    json.status = 400;
    if (err.errors.length > 0) {
      json.errors = err.errors;
    }
  }

  if (err instanceof PayloadTooLargeError) {
    json.status = 413;
  }

  if (err instanceof WaClientLoggedOutError) {
    json.status = 503;
  }

  if (err instanceof WaClientNotReadyError) {
    json.status = 503;
  }

  if (err instanceof WaClientUnexpectedError) {
    json.status = 503;
  }

  if (err instanceof AppError) {
    json.type = err.type;
    json.title = err.title;
    json.detail = err.detail;
  }

  return res.status(json.status).json(json);
};

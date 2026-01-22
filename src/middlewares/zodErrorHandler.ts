import { formatJsonPointer } from "@jsonjoy.com/json-pointer";
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { ValidationError } from "@/errors/appErrors";

export const zodErrorHandler = (
  err: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      detail: issue.message,
      pointer: formatJsonPointer(issue.path as string[]),
    }));

    return next(
      new ValidationError(
        `Yout request does not satify the defined schema.`,
        errors,
      ),
    );
  }

  next(err);
};

import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "../../generated/prisma/client";
import AppError from "../utils/AppError";
import config from "../config";

type TErrorSource = { path: string; message: string };

const handleZodError = (err: ZodError) => {
  const errorSources: TErrorSource[] = err.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
  return { statusCode: 400, message: "Validation error", errorSources };
};

const handlePrismaError = (err: Prisma.PrismaClientKnownRequestError) => {
  let statusCode = 500;
  let message = "Database error";
  const errorSources: TErrorSource[] = [];

  switch (err.code) {
    case "P2002": {
      statusCode = 409;
      const metaTarget = err.meta?.target;
      const target = Array.isArray(metaTarget) ? metaTarget[0] : "";
      const field = target || "field";
      message = `A record with this ${field} already exists`;
      errorSources.push({ path: field, message });
      break;
    }
    case "P2025": {
      statusCode = 404;
      const metaCause = err.meta?.cause;
      message = typeof metaCause === "string" ? metaCause : "Record not found";
      errorSources.push({ path: "", message });
      break;
    }
    default:
      errorSources.push({ path: "", message: err.message });
  }

  return { statusCode, message, errorSources };
};

const globalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = "Internal server error";
  let errorSources: TErrorSource[] = [
    {
      path: "",
      message: err instanceof Error ? err.message : "Something went wrong",
    },
  ];

  if (err instanceof ZodError) {
    ({ statusCode, message, errorSources } = handleZodError(err));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    ({ statusCode, message, errorSources } = handlePrismaError(err));
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [{ path: "", message: err.message }];
  } else if (err instanceof Error) {
    message = err.message;
    errorSources = [{ path: "", message: err.message }];
  }

  let stack: string | undefined;
  if (config.nodeEnv === "development" && err instanceof Error) {
    stack = err.stack;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    stack,
  });
};

export default globalErrorHandler;

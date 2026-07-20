import { Response } from "express";
import type { PaginationMeta } from "../interfaces/payloads";

type TSendResponse<T> = {
  statusCode: number;
  success?: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
};

const sendResponse = <T>(res: Response, payload: TSendResponse<T>) => {
  const { statusCode, success = true, message, data, meta } = payload;

  res.status(statusCode).json({
    success,
    statusCode,
    message,
    meta,
    data,
  });
};

export default sendResponse;

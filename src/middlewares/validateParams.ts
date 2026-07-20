import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";
import AppError from "../utils/AppError";

const validateParams =
  (schema: ZodType) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues.map((i) => i.message).join(", ");
        next(new AppError(400, message));
      } else {
        next(error);
      }
    }
  };

export default validateParams;

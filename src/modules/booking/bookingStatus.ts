import { BookingStatus } from "../../../generated/prisma/client";
import AppError from "../../utils/AppError";

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  REQUESTED: ["ACCEPTED", "DECLINED", "CANCELLED"],
  ACCEPTED: ["PAID", "CANCELLED"],
  PAID: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  DECLINED: [],
  CANCELLED: [],
};

const assertTransition = (from: BookingStatus, to: BookingStatus) => {
  const allowed = VALID_TRANSITIONS[from];

  if (!allowed.includes(to)) {
    throw new AppError(
      400,
      `Invalid status transition: ${from} -> ${to}`
    );
  }
};

export { VALID_TRANSITIONS, assertTransition };

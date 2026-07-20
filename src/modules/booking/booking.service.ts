import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import stripe from "../../lib/stripe";
import { parsePagination, buildMeta } from "../../utils/pagination";
import { Prisma } from "../../../generated/prisma/client";
import { assertTransition } from "./bookingStatus";
import type { PaginationQuery } from "../../interfaces/payloads";
import type { TCreateBookingPayload } from "./booking.validation";

const createBooking = async (
  customerId: string,
  payload: TCreateBookingPayload,
) => {
  const service = await prisma.service.findUnique({
    where: { id: payload.serviceId },
  });

  if (!service) {
    throw new AppError(404, "Service not found!");
  }

  const result = await prisma.booking.create({
    data: {
      customerId,
      serviceId: payload.serviceId,
      technicianProfileId: service.technicianProfileId,
      servicePrice: service.price,
      contactNumber: payload.contactNumber,
      scheduledDate: new Date(payload.scheduledDate),
      timeSlot: payload.timeSlot,
      status: "REQUESTED",
    },
    include: {
      service: true,
      customer: { select: { name: true, email: true } },
      technicianProfile: { include: { user: { select: { name: true } } } },
    },
  });

  return result;
};

const getAllBookings = async (
  userId: string,
  role: string,
  query: PaginationQuery
) => {
  const { page, limit, skip, take, sortBy, sortOrder } = parsePagination(query);
  const where: Prisma.BookingWhereInput = {};

  if (role === "CUSTOMER") {
    where.customerId = userId;
  } else if (role === "TECHNICIAN") {
    where.technicianProfile = { userId };
  }

  const [data, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder } as Prisma.BookingOrderByWithRelationInput,
      include: {
        service: true,
        customer: { select: { name: true, email: true } },
        technicianProfile: { include: { user: { select: { name: true } } } },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return { data, meta: buildMeta(page, limit, total) };
};

const getBookingById = async (bookingId: string, userId: string, role: string) => {
  const result = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      customer: { select: { name: true, email: true } },
      technicianProfile: { include: { user: { select: { name: true } } } },
    },
  });

  if (!result) {
    throw new AppError(404, "Booking not found!");
  }

  const isOwner =
    role === "ADMIN" || result.customerId === userId || result.technicianProfile.userId === userId;

  if (!isOwner) {
    throw new AppError(403, "You are not authorized to view this booking!");
  }

  return result;
};

const cancelBooking = async (bookingId: string, userId: string, reason: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });

  if (!booking) {
    throw new AppError(404, "Booking not found!");
  }

  if (booking.customerId !== userId) {
    throw new AppError(403, "You are not authorized to cancel this booking!");
  }

  if (booking.status === "CANCELLED") {
    throw new AppError(400, "Booking has already been cancelled.");
  }

  if (booking.status === "IN_PROGRESS") {
    throw new AppError(400, "Booking cannot be cancelled after the service has started.");
  }

  if (booking.status === "COMPLETED") {
    throw new AppError(400, "Completed bookings cannot be cancelled.");
  }

  assertTransition(booking.status, "CANCELLED");

  const completedPayment =
    booking.payment && booking.payment.status === "COMPLETED"
      ? booking.payment
      : null;

  if (completedPayment) {
    await stripe.refunds.create({
      payment_intent: completedPayment.transactionId,
    });
  }

  const result = await prisma.$transaction(async (tx) => {
    if (completedPayment) {
      await tx.payment.update({
        where: { bookingId },
        data: { status: "REFUNDED" },
      });
    }

    return tx.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED", cancellationReason: reason },
      include: {
        service: true,
        customer: { select: { name: true, email: true } },
        technicianProfile: { include: { user: { select: { name: true } } } },
        payment: true,
      },
    });
  });

  return result;
};

export const BookingServices = {
  createBooking,
  getAllBookings,
  getBookingById,
  cancelBooking,
};

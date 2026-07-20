import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import { parsePagination, buildMeta } from "../../utils/pagination";
import { Prisma, Status } from "../../../generated/prisma/client";
import type { PaginationQuery } from "../../interfaces/payloads";

const getAllUsers = async (query: PaginationQuery) => {
  const { page, limit, skip, take, sortBy, sortOrder } = parsePagination(query);

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take,
      orderBy: { [sortBy]: sortOrder } as Prisma.UserOrderByWithRelationInput,
      omit: { password: true },
      include: { technicianProfile: true },
    }),
    prisma.user.count(),
  ]);

  return { data, meta: buildMeta(page, limit, total) };
};

const toggleUserStatus = async (userId: string, status: Status) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(404, "User not found!");
  }

  const result = await prisma.user.update({
    where: { id: userId },
    data: { status },
    omit: { password: true },
  });

  return result;
};

const getAllBookings = async (query: PaginationQuery) => {
  const { page, limit, skip, take, sortBy, sortOrder } = parsePagination(query);

  const [data, total] = await Promise.all([
    prisma.booking.findMany({
      skip,
      take,
      orderBy: { [sortBy]: sortOrder } as Prisma.BookingOrderByWithRelationInput,
      include: {
        service: true,
        customer: { select: { name: true, email: true } },
        technicianProfile: { include: { user: { select: { name: true } } } },
      },
    }),
    prisma.booking.count(),
  ]);

  return { data, meta: buildMeta(page, limit, total) };
};

const getBookingById = async (bookingId: string) => {
  const result = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      customer: { select: { name: true, email: true } },
      technicianProfile: { include: { user: { select: { name: true } } } },
      payment: true,
      review: true,
    },
  });

  if (!result) {
    throw new AppError(404, "Booking not found!");
  }

  return result;
};

const getAllPayments = async () => {
  const result = await prisma.payment.findMany({
    include: {
      booking: {
        include: {
          service: true,
          customer: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return result;
};

const getPaymentById = async (paymentId: string) => {
  const result = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          service: true,
          customer: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!result) {
    throw new AppError(404, "Payment not found!");
  }

  return result;
};

export const AdminServices = {
  getAllUsers,
  toggleUserStatus,
  getAllBookings,
  getBookingById,
  getAllPayments,
  getPaymentById,
};

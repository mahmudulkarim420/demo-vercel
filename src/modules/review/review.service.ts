import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import type { TCreateReviewPayload } from "./review.validation";

const createReview = async (customerId: string, payload: TCreateReviewPayload) => {
  const booking = await prisma.booking.findUnique({
    where: { id: payload.bookingId },
  });

  if (!booking) {
    throw new AppError(404, "Booking not found!");
  }

  if (booking.customerId !== customerId) {
    throw new AppError(403, "You are not authorized to review this booking!");
  }

  if (booking.status !== "COMPLETED") {
    throw new AppError(400, "You can only leave a review after the job is COMPLETED");
  }

  const existingReview = await prisma.review.findUnique({
    where: { bookingId: payload.bookingId },
  });

  if (existingReview) {
    throw new AppError(409, "Review already exists for this booking!");
  }

  const technicianProfileId = booking.technicianProfileId;

  const result = await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        bookingId: payload.bookingId,
        customerId,
        technicianProfileId,
        rating: payload.rating,
        comment: payload.comment,
      },
      include: {
        customer: { select: { name: true, email: true } },
        technicianProfile: { select: { id: true } },
      },
    });

    const reviews = await tx.review.findMany({
      where: { technicianProfileId },
      select: { rating: true },
    });

    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    await tx.technicianProfile.update({
      where: { id: technicianProfileId },
      data: { totalReviews, averageRating },
    });

    return review;
  });

  return result;
};

export const ReviewServices = {
  createReview,
};

import { z } from "zod";

const createBookingValidationSchema = z.object({
  body: z
    .object({
      serviceId: z
        .string({ message: "Service ID is required" })
        .uuid({ message: "Invalid Service ID format" }),
      scheduledDate: z
        .string()
        .date({ message: "Invalid date format. Use YYYY-MM-DD" }),
      timeSlot: z
        .string({ message: "Time slot is required" })
        .trim()
        .min(1, "Time slot cannot be empty"),
      contactNumber: z
        .string({ message: "Contact number is required" })
        .trim()
        .min(1, "Contact number cannot be empty"),
    })
    .strict(),
});

export type TCreateBookingPayload = z.infer<typeof createBookingValidationSchema>["body"];

const cancelBookingValidationSchema = z.object({
  body: z
    .object({
      reason: z
        .string({ message: "Cancellation reason is required" })
        .trim()
        .min(1, "Cancellation reason cannot be empty"),
    })
    .strict(),
});

export type TCancelBookingPayload = z.infer<typeof cancelBookingValidationSchema>["body"];

export const BookingValidations = {
  createBookingValidationSchema,
  cancelBookingValidationSchema,
};

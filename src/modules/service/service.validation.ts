import { z } from "zod";

const createServiceValidationSchema = z.object({
  body: z
    .object({
      title: z
        .string({ message: "Title is required" })
        .trim()
        .min(3, "Title must be at least 3 characters"),
      description: z
        .string({ message: "Description is required" })
        .trim()
        .min(1, "Description cannot be empty"),
      price: z
        .number({ message: "Price is required" })
        .nonnegative("Price must be a positive number"),
      categoryId: z
        .string({ message: "Category ID is required" })
        .uuid({ message: "Invalid Category ID format" }),
    })
    .strict(),
});

const updateServiceValidationSchema = z.object({
  body: z
    .object({
      title: z
        .string({ message: "Title must be a string" })
        .trim()
        .min(3, "Title must be at least 3 characters")
        .optional(),
      description: z
        .string({ message: "Description must be a string" })
        .trim()
        .min(1, "Description cannot be empty")
        .optional(),
      price: z
        .number({ message: "Price must be a number" })
        .nonnegative("Price must be a positive number")
        .optional(),
      categoryId: z
        .string({ message: "Category ID must be a string" })
        .uuid({ message: "Invalid Category ID format" })
        .optional(),
    })
    .strict(),
});

export type TCreateServicePayload = z.infer<typeof createServiceValidationSchema>["body"];
export type TUpdateServicePayload = z.infer<typeof updateServiceValidationSchema>["body"];

export const ServiceValidations = {
  createServiceValidationSchema,
  updateServiceValidationSchema,
};

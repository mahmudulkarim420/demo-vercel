import { z } from "zod";

const createCategoryValidationSchema = z.object({
  body: z
    .object({
      name: z
        .string({ message: "Category name is required" })
        .trim()
        .min(1, "Category name cannot be empty"),
      description: z
        .string({ message: "Description string is required" })
        .trim()
        .min(1, "Description cannot be empty")
        .optional(),
    })
    .strict(),
});

const updateCategoryValidationSchema = z.object({
  body: z
    .object({
      name: z
        .string({ message: "Category name must be a string" })
        .trim()
        .min(1, "Category name cannot be empty")
        .optional(),
      description: z
        .string({ message: "Description must be a string" })
        .trim()
        .min(1, "Description cannot be empty")
        .optional(),
    })
    .strict(),
});

export type TCreateCategoryPayload = z.infer<typeof createCategoryValidationSchema>["body"];
export type TUpdateCategoryPayload = z.infer<typeof updateCategoryValidationSchema>["body"];

export const CategoryValidations = {
  createCategoryValidationSchema,
  updateCategoryValidationSchema,
};

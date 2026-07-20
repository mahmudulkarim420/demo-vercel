import { z } from "zod";

const idParamValidationSchema = z.object({
  id: z.string().uuid({ message: "Invalid UUID format for id parameter" }),
});

const paginationQuerySchema = z
  .object({
    page: z.string().regex(/^\d+$/, "Page must be a number").optional(),
    limit: z.string().regex(/^\d+$/, "Limit must be a number").optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    searchTerm: z.string().optional(),
  })
  .strict();

export { idParamValidationSchema, paginationQuerySchema };

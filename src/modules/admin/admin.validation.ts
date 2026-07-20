import { z } from "zod";

const toggleUserStatusValidationSchema = z.object({
  body: z
    .object({
      status: z.enum(["ACTIVE", "BANNED"], { message: "Invalid status" }),
    })
    .strict(),
});

export type TToggleUserStatusPayload = z.infer<typeof toggleUserStatusValidationSchema>["body"];

export const AdminValidations = {
  toggleUserStatusValidationSchema,
};

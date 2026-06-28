import { z } from "zod";

/** Admin-only edits to another user's account. */
export const adminUpdateUserSchema = z.object({
  role: z.enum(["ADMIN", "USER"]).optional(),
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  country: z.string().trim().max(80).nullish(),
});

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

import { z } from "zod";

/** Admin-only edits to another user's account. */
export const adminUpdateUserSchema = z.object({
  role: z.enum(["ADMIN", "USER"]).optional(),
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  dateOfBirth: z.iso.date().nullish(),
  gender: z.string().trim().max(40).nullish(),
  address: z.string().trim().max(200).nullish(),
  country: z.string().trim().max(80).nullish(),
  bio: z.string().trim().max(280).nullish(),
});

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

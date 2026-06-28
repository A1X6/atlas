import { z } from "zod";

// Strong-but-usable password policy. Kept here so it's reused by API + UI.
// Validation messages are i18n KEYS (namespace `validation`); the API error
// responder localizes them per request locale. See src/server/http/respond.ts.
export const passwordSchema = z
  .string()
  .min(8, "password_min")
  .max(128, "password_max")
  .regex(/[a-zA-Z]/, "password_letter")
  .regex(/[0-9]/, "password_number");

export const phoneSchema = z.object({
  countryCode: z.string().trim().min(1, "phone_country_required").max(6),
  number: z.string().trim().min(3, "phone_number_invalid").max(32),
  isPrimary: z.boolean().optional().default(false),
});

export const emailEntrySchema = z.object({
  address: z.email("email_invalid").trim().toLowerCase(),
  isPrimary: z.boolean().optional().default(false),
});

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "firstName_required").max(80),
  lastName: z.string().trim().min(1, "lastName_required").max(80),
  password: passwordSchema,
  dateOfBirth: z.iso.date().optional(),
  gender: z.string().trim().max(40).optional(),
  address: z.string().trim().max(200).optional(),
  country: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(280).optional(),
  avatarUrl: z.url().optional(),
  emails: z.array(emailEntrySchema).min(1, "emails_min").max(5),
  phones: z.array(phoneSchema).min(1, "phones_min").max(5),
});

export const loginSchema = z.object({
  email: z.email("email_invalid").trim().toLowerCase(),
  password: z.string().min(1, "password_required"),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(10),
});

export const forgotPasswordSchema = z.object({
  email: z.email("email_invalid").trim().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

import { z } from "zod";
import { emailEntrySchema, phoneSchema } from "./auth-schemas";

/** Update the signed-in user's own profile + emails + phones. */
export const updateAccountSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  dateOfBirth: z.iso.date().nullish(),
  gender: z.string().trim().max(40).nullish(),
  address: z.string().trim().max(200).nullish(),
  country: z.string().trim().max(80).nullish(),
  bio: z.string().trim().max(280).nullish(),
  avatarUrl: z.url().nullish(),
  emails: z.array(emailEntrySchema).min(1, "emails_min").max(5),
  phones: z.array(phoneSchema).min(1, "phones_min").max(5),
});

export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

/** Identify one of the signed-in user's phone numbers for SMS verification. */
export const requestPhoneCodeSchema = z.object({
  countryCode: z.string().trim().min(1, "phone_country_required").max(6),
  number: z.string().trim().min(3, "phone_number_invalid").max(32),
});

/** Submit an SMS code to verify a phone number. */
export const confirmPhoneSchema = requestPhoneCodeSchema.extend({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "otp_invalid"),
});

export type RequestPhoneCodeInput = z.infer<typeof requestPhoneCodeSchema>;
export type ConfirmPhoneInput = z.infer<typeof confirmPhoneSchema>;

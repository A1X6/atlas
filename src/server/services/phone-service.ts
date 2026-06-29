import "server-only";
import { prisma } from "@/src/server/db";
import { NotFoundError, ValidationError } from "@/src/server/http/errors";
import { generateOtpCode, hashOtp, evaluateOtp, OTP_TTL_MS } from "@/src/server/auth/otp";
import { phoneKey } from "@/src/server/repositories/user-repo";
import { sendSms } from "@/src/server/sms/sms-sender";

/**
 * Phone verification via SMS one-time codes. A user requests a code for one of
 * their own phone numbers, then confirms it. Codes are single-use, time-limited,
 * and attempt-capped (see otp.ts). Verifying marks the Phone row `verified`.
 */

/** Send a fresh SMS code for a phone the signed-in user owns (best-effort no-op if already verified). */
export async function requestPhoneVerification(
  userId: string,
  countryCode: string,
  number: string,
): Promise<void> {
  const phone = await prisma.phone.findFirst({
    where: { userId, countryCode, number },
    select: { id: true, verified: true },
  });
  if (!phone) throw new NotFoundError("That phone number isn't on your account");
  if (phone.verified) return; // already verified — nothing to send

  const code = generateOtpCode();
  await prisma.verificationToken.create({
    data: {
      userId,
      type: "PHONE_VERIFY",
      phone: phoneKey(countryCode, number),
      tokenHash: hashOtp(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  await sendSms({
    // E.164 (digits only, leading +) is what Twilio expects, e.g. "+447700900812".
    to: `+${`${countryCode}${number}`.replace(/\D/g, "")}`,
    text: `Your Atlas verification code is ${code}. It expires in 10 minutes. If you didn't request this, ignore this message.`,
  });
}

/** Verify a submitted code and, on success, mark the phone verified. */
export async function confirmPhoneVerification(
  userId: string,
  countryCode: string,
  number: string,
  code: string,
): Promise<boolean> {
  const key = phoneKey(countryCode, number);
  const record = await prisma.verificationToken.findFirst({
    where: { userId, type: "PHONE_VERIFY", phone: key, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const verdict = evaluateOtp({ record, code, now: Date.now() });

  if (verdict === "mismatch") {
    // Count the failed guess so brute force runs out of attempts.
    await prisma.verificationToken.update({
      where: { id: record!.id },
      data: { attempts: { increment: 1 } },
    });
    throw new ValidationError("Invalid or expired verification code");
  }
  if (verdict !== "ok") {
    throw new ValidationError("Invalid or expired verification code");
  }

  // Atomically consume the code (guarding against a double-submit race) and
  // mark the phone verified.
  await prisma.$transaction([
    prisma.verificationToken.updateMany({
      where: { id: record!.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.phone.updateMany({
      where: { userId, countryCode, number },
      data: { verified: true },
    }),
  ]);

  return true;
}

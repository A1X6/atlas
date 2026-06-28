import { createHash, randomInt } from "node:crypto";

/**
 * One-time passcodes for phone (SMS) verification. Unlike high-entropy URL
 * tokens, a 6-digit code is brute-forceable, so codes are short-lived, single
 * use, and capped at OTP_MAX_ATTEMPTS guesses. Only the SHA-256 hash of a code
 * is ever persisted — a DB leak can't reveal in-flight codes.
 *
 * This module is intentionally pure (no DB / no env) so the decision logic is
 * unit-testable; persistence + delivery live in the phone service.
 */

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_MAX_ATTEMPTS = 5;

/** Cryptographically-random, zero-padded 6-digit code (000000–999999). */
export function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** SHA-256 is appropriate here: the code space is enforced by attempt limits. */
export function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export type OtpRecord = {
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  attempts: number;
};

export type OtpVerdict = "ok" | "mismatch" | "invalid";

/**
 * Decide whether a submitted `code` clears a stored OTP record.
 *  - "ok"       → matches; caller should consume the token + mark verified.
 *  - "mismatch" → record is usable but the code is wrong; caller should count an attempt.
 *  - "invalid"  → missing, used, expired, or out of attempts (generic failure).
 */
export function evaluateOtp(args: {
  record: OtpRecord | null;
  code: string;
  now: number;
}): OtpVerdict {
  const { record, code, now } = args;
  if (!record) return "invalid";
  if (record.usedAt !== null) return "invalid";
  if (record.expiresAt.getTime() < now) return "invalid";
  if (record.attempts >= OTP_MAX_ATTEMPTS) return "invalid";
  return hashOtp(code) === record.tokenHash ? "ok" : "mismatch";
}

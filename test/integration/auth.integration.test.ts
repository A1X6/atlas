import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// Capture SMS codes so we can complete the phone-verification flow.
const smsLog: { to: string; text: string }[] = [];
vi.mock("@/src/server/sms/sms-sender", () => ({
  sendSms: vi.fn(async (sms: { to: string; text: string }) => {
    smsLog.push(sms);
  }),
}));
// Don't actually log verification emails during the run.
vi.mock("@/src/server/email/mailer", () => ({ sendEmail: vi.fn(async () => {}) }));

import { prisma } from "@/src/server/db";
import {
  registerUser,
  loginUser,
  verifyEmail,
} from "@/src/server/services/auth-service";
import {
  requestPhoneVerification,
  confirmPhoneVerification,
} from "@/src/server/services/phone-service";
import {
  AccountLockedError,
  EmailNotVerifiedError,
  UnauthorizedError,
} from "@/src/server/http/errors";
import { MAX_FAILED_ATTEMPTS } from "@/src/server/auth/lockout";
import { createVerificationToken } from "@/src/server/services/token-service";

const ctx = { ip: "itest", userAgent: "vitest-integration" };
const stamp = Date.now();
const email = `itest+${stamp}@atlas.test`;
const password = "Itest1234";
const country = "+1";
const number = `555 ${stamp.toString().slice(-4)}`;

let userId: string;

beforeAll(async () => {
  // Skip the whole suite if there's no real DB configured.
  await prisma.$queryRaw`SELECT 1`;
});

afterAll(async () => {
  if (userId) {
    await prisma.user.deleteMany({ where: { id: userId } });
  }
  await prisma.$disconnect();
});

describe("registration gating + login + lockout (integration)", () => {
  it("registration creates an UNVERIFIED account and issues no session", async () => {
    const { user } = await registerUser({
      firstName: "Ivy",
      lastName: "Tester",
      password,
      emails: [{ address: email, isPrimary: true }],
      phones: [{ countryCode: country, number, isPrimary: true }],
    });
    expect(user).toBeTruthy();
    userId = user!.id;
    const emails = await prisma.email.findMany({ where: { userId } });
    expect(emails.every((e) => !e.verified)).toBe(true);
  });

  it("login is BLOCKED until the email is verified", async () => {
    await expect(loginUser({ email, password }, ctx)).rejects.toBeInstanceOf(
      EmailNotVerifiedError,
    );
  });

  it("login SUCCEEDS once the email is verified", async () => {
    // Mint + consume a real verification token (mirrors the email link flow).
    const token = await createVerificationToken({
      userId,
      type: "EMAIL_VERIFY",
      email,
      ttlMs: 60_000,
    });
    expect(await verifyEmail(token)).toBe(true);

    const res = await loginUser({ email, password }, ctx);
    expect(res.accessToken).toBeTruthy();
  });

  it("locks the account after too many failed attempts, then blocks even a correct password", async () => {
    // Reset to a clean state for the lockout sequence.
    await prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    for (let i = 0; i < MAX_FAILED_ATTEMPTS - 1; i++) {
      await expect(loginUser({ email, password: "wrong-pass-1" }, ctx)).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
    }
    // The attempt that crosses the threshold reports the lock.
    await expect(loginUser({ email, password: "wrong-pass-1" }, ctx)).rejects.toBeInstanceOf(
      AccountLockedError,
    );
    // A correct password is now refused while locked.
    await expect(loginUser({ email, password }, ctx)).rejects.toBeInstanceOf(AccountLockedError);

    // Unlock and confirm normal login resumes + counter cleared.
    await prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
    const res = await loginUser({ email, password }, ctx);
    expect(res.accessToken).toBeTruthy();
    const fresh = await prisma.user.findUnique({ where: { id: userId } });
    expect(fresh?.failedLoginAttempts).toBe(0);
  });
});

describe("phone SMS verification (integration)", () => {
  it("request → wrong code rejected → correct code verifies the phone", async () => {
    smsLog.length = 0;
    await requestPhoneVerification(userId, country, number);
    expect(smsLog.length).toBe(1);
    const code = smsLog[smsLog.length - 1].text.match(/\b(\d{6})\b/)![1];
    const wrong = code === "000000" ? "111111" : "000000";

    await expect(confirmPhoneVerification(userId, country, number, wrong)).rejects.toBeTruthy();
    expect(await confirmPhoneVerification(userId, country, number, code)).toBe(true);

    const phone = await prisma.phone.findFirst({ where: { userId, countryCode: country, number } });
    expect(phone?.verified).toBe(true);
  });
});

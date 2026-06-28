import "server-only";
import { ConflictError, UnauthorizedError } from "@/src/server/http/errors";
import { hashPassword, verifyPassword } from "@/src/server/auth/password";
import {
  createRefreshToken,
  hashToken,
  signAccessToken,
  verifyRefreshToken,
  type RefreshTokenResult,
} from "@/src/server/auth/tokens";
import * as users from "@/src/server/repositories/user-repo";
import type { RegisterInput, LoginInput } from "@/src/server/validation/auth-schemas";
import { getEnv } from "@/src/server/env";
import { sendEmail } from "@/src/server/email/mailer";
import {
  createVerificationToken,
  consumeVerificationToken,
} from "@/src/server/services/token-service";

export type RequestContext = { userAgent?: string | null; ip?: string | null };

// A precomputed argon2 hash used to equalize timing when an email doesn't exist
// (mitigates user-enumeration via response timing). Value is irrelevant.
const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$c29tZS1zYWx0LXZhbHVl$3hHk2m0bqe1m6Yl3o0V6oQ3m0bqe1m6Yl3o0V6oQ3";

type Issued = {
  user: Awaited<ReturnType<typeof users.getUserProfile>>;
  accessToken: string;
  refresh: RefreshTokenResult;
};

async function issueTokens(
  userId: string,
  role: "ADMIN" | "USER",
  ctx: RequestContext,
): Promise<{ accessToken: string; refresh: RefreshTokenResult }> {
  const accessToken = await signAccessToken(userId, role);
  const refresh = await createRefreshToken(userId);
  await users.storeRefreshToken({
    userId,
    jti: refresh.jti,
    tokenHash: refresh.tokenHash,
    expiresAt: refresh.expiresAt,
    userAgent: ctx.userAgent ?? null,
    ip: ctx.ip ?? null,
  });
  return { accessToken, refresh };
}

export async function registerUser(input: RegisterInput, ctx: RequestContext): Promise<Issued> {
  const addresses = input.emails.map((e) => e.address);
  const existing = await users.findAnyEmail(addresses);
  if (existing) {
    throw new ConflictError("An account with one of these emails already exists");
  }

  const passwordHash = await hashPassword(input.password);

  // Self-registration always creates a regular user. Admins are provisioned via seed/DB.
  const profile = await users.createUser({
    firstName: input.firstName,
    lastName: input.lastName,
    passwordHash,
    role: "USER",
    dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
    gender: input.gender ?? null,
    address: input.address ?? null,
    country: input.country ?? null,
    bio: input.bio ?? null,
    avatarUrl: input.avatarUrl ?? null,
    emails: input.emails.map((e) => ({ address: e.address, isPrimary: e.isPrimary })),
    phones: input.phones.map((p) => ({
      countryCode: p.countryCode,
      number: p.number,
      isPrimary: p.isPrimary,
    })),
  });

  const { accessToken, refresh } = await issueTokens(profile.id, profile.role, ctx);

  // Fire a verification email; never fail registration if mail delivery fails.
  try {
    await sendEmailVerification(profile.id);
  } catch (e) {
    console.error("Failed to send verification email:", e);
  }

  return { user: profile, accessToken, refresh };
}

export async function loginUser(input: LoginInput, ctx: RequestContext): Promise<Issued> {
  const account = await users.findUserByEmailForAuth(input.email);

  if (!account) {
    await verifyPassword(DUMMY_HASH, input.password); // equalize timing
    throw new UnauthorizedError("Invalid email or password");
  }

  const valid = await verifyPassword(account.passwordHash, input.password);
  if (!valid) throw new UnauthorizedError("Invalid email or password");

  const { accessToken, refresh } = await issueTokens(account.id, account.role, ctx);
  const profile = await users.getUserProfile(account.id);
  return { user: profile, accessToken, refresh };
}

export async function rotateRefresh(
  rawToken: string | undefined,
  ctx: RequestContext,
): Promise<{ accessToken: string; refresh: RefreshTokenResult }> {
  if (!rawToken) throw new UnauthorizedError("Missing refresh token");

  let claims: { sub: string; jti: string };
  try {
    claims = await verifyRefreshToken(rawToken);
  } catch {
    throw new UnauthorizedError("Invalid refresh token");
  }

  const record = await users.findRefreshTokenByJti(claims.jti);
  if (
    !record ||
    record.revoked ||
    record.userId !== claims.sub ||
    record.expiresAt.getTime() < Date.now() ||
    record.tokenHash !== hashToken(rawToken)
  ) {
    // Possible reuse of a rotated/stolen token → revoke the whole family.
    if (record) await users.revokeAllUserRefreshTokens(record.userId);
    throw new UnauthorizedError("Invalid refresh token");
  }

  // Rotate: revoke the used token, issue a fresh pair.
  await users.revokeRefreshToken(claims.jti);
  const profile = await users.getUserProfile(claims.sub);
  if (!profile) throw new UnauthorizedError("Account no longer exists");
  return issueTokens(profile.id, profile.role, ctx);
}

export async function logout(rawToken: string | undefined): Promise<void> {
  if (!rawToken) return;
  try {
    const { jti } = await verifyRefreshToken(rawToken);
    await users.revokeRefreshToken(jti);
  } catch {
    /* already invalid — nothing to revoke */
  }
}

export async function getMe(userId: string) {
  return users.getUserProfile(userId);
}

// ── Email verification ────────────────────────────────────────────────────────
const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

/** Send a verification link for the user's first unverified email (best-effort). */
export async function sendEmailVerification(userId: string): Promise<void> {
  const emails = await users.getUserEmails(userId);
  const target = emails.find((e) => !e.verified) ?? emails[0];
  if (!target || target.verified) return;

  const token = await createVerificationToken({
    userId,
    type: "EMAIL_VERIFY",
    email: target.address,
    ttlMs: EMAIL_VERIFY_TTL_MS,
  });
  const link = `${getEnv().APP_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: target.address,
    subject: "Verify your Atlas email",
    text: `Welcome to Atlas! Confirm this email address:\n${link}\n\nThis link expires in 24 hours.`,
  });
}

export async function verifyEmail(rawToken: string): Promise<boolean> {
  const consumed = await consumeVerificationToken(rawToken, "EMAIL_VERIFY");
  if (!consumed?.email) return false;
  await users.markEmailVerified(consumed.email);
  return true;
}

// ── Password reset ────────────────────────────────────────────────────────────
/** Always resolves (no account enumeration); only sends mail if the user exists. */
export async function requestPasswordReset(email: string): Promise<void> {
  const account = await users.findUserByEmailForAuth(email);
  if (!account) return;

  const token = await createVerificationToken({
    userId: account.id,
    type: "PASSWORD_RESET",
    email,
    ttlMs: PASSWORD_RESET_TTL_MS,
  });
  const link = `${getEnv().APP_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Reset your Atlas password",
    text: `We received a request to reset your password:\n${link}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
  });
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<boolean> {
  const consumed = await consumeVerificationToken(rawToken, "PASSWORD_RESET");
  if (!consumed) return false;
  const passwordHash = await hashPassword(newPassword);
  await users.updateUserPassword(consumed.userId, passwordHash);
  // Invalidate all existing sessions after a password change.
  await users.revokeAllUserRefreshTokens(consumed.userId);
  return true;
}

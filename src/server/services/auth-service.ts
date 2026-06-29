import "server-only";
import {
  AccountLockedError,
  ConflictError,
  EmailNotVerifiedError,
  UnauthorizedError,
} from "@/src/server/http/errors";
import { isLocked, registerFailedAttempt } from "@/src/server/auth/lockout";
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
import { requestPhoneVerification } from "@/src/server/services/phone-service";

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

export type Registered = { user: Awaited<ReturnType<typeof users.getUserProfile>> };

/**
 * Create an account but DO NOT start a session: the user must verify their email
 * before they can sign in (consistent with the login gate). We still dispatch
 * the verification email + phone SMS here.
 */
export async function registerUser(input: RegisterInput): Promise<Registered> {
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

  // Fire verification for the new email + each phone; never fail registration if
  // delivery fails. Phones are added unverified and confirmed via SMS code.
  await Promise.allSettled([
    sendEmailVerification(profile.id),
    ...input.phones.map((p) => requestPhoneVerification(profile.id, p.countryCode, p.number)),
  ]);

  return { user: profile };
}

export async function loginUser(input: LoginInput, ctx: RequestContext): Promise<Issued> {
  const account = await users.findUserByEmailForAuth(input.email);

  if (!account) {
    await verifyPassword(DUMMY_HASH, input.password); // equalize timing
    throw new UnauthorizedError("Invalid email or password");
  }

  // Refuse a locked account before checking the password (an attacker who
  // triggered the lock already knows the email exists).
  if (isLocked(account.lockedUntil, Date.now())) throw new AccountLockedError();

  const valid = await verifyPassword(account.passwordHash, input.password);
  if (!valid) {
    // Count the failure; lock the account once the threshold is reached.
    const next = registerFailedAttempt(account.failedLoginAttempts, Date.now());
    await users.setLoginState(account.id, next);
    if (next.lockedUntil) throw new AccountLockedError();
    throw new UnauthorizedError("Invalid email or password");
  }

  // Correct password → clear any accumulated failures.
  if (account.failedLoginAttempts > 0 || account.lockedUntil) {
    await users.setLoginState(account.id, { failedLoginAttempts: 0, lockedUntil: null });
  }

  // Require the email used to be verified. Only verified emails are usable login
  // identities; unverified ones (e.g. newly added addresses) are dead until
  // confirmed. Checked post-password so it can't be used to enumerate accounts.
  if (!account.emailVerified) throw new EmailNotVerifiedError();

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

/**
 * Send a verification link for one of the user's emails (best-effort).
 * With an `address`, targets that specific email — but only if the user owns it
 * and it's still unverified (unknown addresses are ignored, no leak). Without
 * one, falls back to the first unverified email.
 */
export async function sendEmailVerification(userId: string, address?: string): Promise<void> {
  const emails = await users.getUserEmails(userId);
  const target = address
    ? emails.find((e) => e.address === address)
    : (emails.find((e) => !e.verified) ?? emails[0]);
  if (!target || target.verified) return;
  await sendEmailVerificationFor(userId, target.address);
}

/** Send a verification link for one specific email address owned by the user. */
export async function sendEmailVerificationFor(userId: string, address: string): Promise<void> {
  const token = await createVerificationToken({
    userId,
    type: "EMAIL_VERIFY",
    email: address,
    ttlMs: EMAIL_VERIFY_TTL_MS,
  });
  const link = `${getEnv().APP_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: address,
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

/**
 * Resend the verification link after a valid-but-unverified login attempt,
 * WITHOUT starting a session. Re-validates the password so only the account
 * owner can trigger it, and always resolves the same way regardless of outcome
 * (no account enumeration, mirroring `loginUser`). Drives the login screen's
 * "email not verified" panel so a blocked user is never left without a path.
 */
export async function resendVerificationForCredentials(
  email: string,
  password: string,
): Promise<void> {
  const account = await users.findUserByEmailForAuth(email);
  if (!account) {
    await verifyPassword(DUMMY_HASH, password); // equalize timing — no enumeration
    return;
  }
  const valid = await verifyPassword(account.passwordHash, password);
  if (!valid || account.emailVerified) return; // bad creds or already verified → no-op
  await sendEmailVerification(account.id);
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

import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";
import { getEnv } from "@/src/server/env";

/**
 * Token strategy:
 *  - Access token: short-lived JWT (HS256), carries { sub, role }. Sent as a
 *    Bearer header by web + mobile clients. Stateless → horizontal scale.
 *  - Refresh token: long-lived JWT carrying a unique { jti }. We store only a
 *    SHA-256 hash of the token in the DB (keyed by jti) so it can be rotated and
 *    revoked. Raw refresh tokens never touch the database.
 */

export type AccessClaims = { sub: string; role: Role };

function accessKey() {
  return new TextEncoder().encode(getEnv().JWT_ACCESS_SECRET);
}
function refreshKey() {
  return new TextEncoder().encode(getEnv().JWT_REFRESH_SECRET);
}

export async function signAccessToken(userId: string, role: Role): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(getEnv().ACCESS_TOKEN_TTL)
    .sign(accessKey());
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  const { payload } = await jwtVerify(token, accessKey(), { algorithms: ["HS256"] });
  return { sub: payload.sub as string, role: payload.role as Role };
}

export type RefreshTokenResult = {
  token: string;
  jti: string;
  tokenHash: string;
  expiresAt: Date;
};

export async function createRefreshToken(userId: string): Promise<RefreshTokenResult> {
  const jti = randomUUID();
  const days = getEnv().REFRESH_TOKEN_TTL_DAYS;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(refreshKey());

  return { token, jti, tokenHash: hashToken(token), expiresAt };
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string; jti: string }> {
  const { payload } = await jwtVerify(token, refreshKey(), { algorithms: ["HS256"] });
  return { sub: payload.sub as string, jti: payload.jti as string };
}

/** SHA-256 is appropriate for high-entropy tokens (unlike passwords, which use argon2). */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

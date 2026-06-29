import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";

/**
 * The "identity" token is a WEB-ONLY optimistic-auth hint, signed with its own
 * secret (HS256). It is set as the `atlas_session` cookie (path "/") so the
 * proxy and Server Components can know — without a DB hit — whether a request is
 * authenticated, and render the right nav / redirect before any HTML is sent.
 *
 * Crucially this token NEVER authorizes the API. Data endpoints stay Bearer-only
 * (see `guards.ts`), which is what native mobile clients use. A separate secret
 * (not the access-token secret) means an identity cookie can't be replayed as an
 * access token to bypass the short access-token TTL.
 *
 * Deliberately dependency-light (jose + `process.env` only, no `next/headers` or
 * `node:crypto`) so it is safe to import from the edge proxy.
 */

export const SESSION_COOKIE = "atlas_session";

export type Identity = { sub: string; role: Role };

function sessionKey(): Uint8Array | null {
  const secret = process.env.JWT_SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

/** Whether server-side optimistic auth is enabled (secret configured). */
export function isIdentityConfigured(): boolean {
  return sessionKey() !== null;
}

/** Sign an identity token. Returns null when the feature is disabled. */
export async function signIdentity(id: Identity, ttlDays: number): Promise<string | null> {
  const key = sessionKey();
  if (!key) return null;
  return new SignJWT({ role: id.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(id.sub)
    .setIssuedAt()
    .setExpirationTime(`${ttlDays}d`)
    .sign(key);
}

/** Verify an identity token. Returns null if disabled, missing, or invalid. */
export async function verifyIdentity(token: string | undefined | null): Promise<Identity | null> {
  const key = sessionKey();
  if (!key || !token) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return { sub: payload.sub as string, role: payload.role as Role };
  } catch {
    return null;
  }
}

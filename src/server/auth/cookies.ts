import "server-only";
import { cookies } from "next/headers";
import { getEnv, isProd } from "@/src/server/env";
import { SESSION_COOKIE } from "@/src/server/auth/identity";

/**
 * The refresh token lives in an httpOnly cookie scoped to the auth endpoints.
 * Because the rest of the API authenticates via Bearer tokens (no ambient
 * cookie), data routes are not exposed to CSRF. SameSite=strict further limits
 * the refresh cookie to first-party use.
 */
export const REFRESH_COOKIE = "atlas_refresh";
const REFRESH_PATH = "/api/v1/auth";

export async function setRefreshCookie(token: string) {
  const store = await cookies();
  store.set(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: REFRESH_PATH,
    maxAge: getEnv().REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  });
}

export async function clearRefreshCookie() {
  const store = await cookies();
  store.set(REFRESH_COOKIE, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: REFRESH_PATH,
    maxAge: 0,
  });
}

export async function readRefreshCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value;
}

/**
 * The identity cookie (web-only optimistic auth) is readable on every request —
 * path "/" and SameSite=lax so it survives top-level navigations (e.g. arriving
 * from an emailed link) — which the strict, auth-path-scoped refresh cookie is
 * deliberately not. It is httpOnly and carries no privileges of its own.
 */
export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: getEnv().REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function readSessionCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

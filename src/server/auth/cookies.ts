import "server-only";
import { cookies } from "next/headers";
import { getEnv, isProd } from "@/src/server/env";

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

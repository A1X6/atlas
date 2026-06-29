import type { NextRequest } from "next/server";
import { handle, ok } from "@/src/server/http/respond";
import { ValidationError } from "@/src/server/http/errors";
import { loginSchema } from "@/src/server/validation/auth-schemas";
import { loginUser } from "@/src/server/services/auth-service";
import { setRefreshCookie, setSessionCookie } from "@/src/server/auth/cookies";
import { signIdentity } from "@/src/server/auth/identity";
import { getEnv } from "@/src/server/env";
import { enforceRateLimit, clientIp } from "@/src/server/security/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async (req: NextRequest) => {
  const ip = clientIp(req);
  // Brute-force protection: limit by IP (and the limiter could be extended per-email).
  await enforceRateLimit("login", ip, 10, "5 m");

  const body = await req.json().catch(() => {
    throw new ValidationError("Invalid JSON body");
  });
  const input = loginSchema.parse(body);

  const { user, accessToken, refresh } = await loginUser(input, {
    ip,
    userAgent: req.headers.get("user-agent"),
  });

  await setRefreshCookie(refresh.token);
  // Web-only optimistic-auth hint (ignored by mobile clients, which use the
  // accessToken in the response body). No-ops if JWT_SESSION_SECRET is unset.
  if (user) {
    const identity = await signIdentity(
      { sub: user.id, role: user.role },
      getEnv().REFRESH_TOKEN_TTL_DAYS,
    );
    if (identity) await setSessionCookie(identity);
  }

  return ok({ user, accessToken });
});

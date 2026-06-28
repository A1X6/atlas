import type { NextRequest } from "next/server";
import { handle, ok } from "@/src/server/http/respond";
import { ValidationError } from "@/src/server/http/errors";
import { loginSchema } from "@/src/server/validation/auth-schemas";
import { loginUser } from "@/src/server/services/auth-service";
import { setRefreshCookie } from "@/src/server/auth/cookies";
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
  return ok({ user, accessToken });
});

import type { NextRequest } from "next/server";
import { handle, created } from "@/src/server/http/respond";
import { ValidationError } from "@/src/server/http/errors";
import { registerSchema } from "@/src/server/validation/auth-schemas";
import { registerUser } from "@/src/server/services/auth-service";
import { setRefreshCookie } from "@/src/server/auth/cookies";
import { enforceRateLimit, clientIp } from "@/src/server/security/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async (req: NextRequest) => {
  const ip = clientIp(req);
  await enforceRateLimit("register", ip, 5, "10 m");

  const body = await req.json().catch(() => {
    throw new ValidationError("Invalid JSON body");
  });
  const input = registerSchema.parse(body);

  const { user, accessToken, refresh } = await registerUser(input, {
    ip,
    userAgent: req.headers.get("user-agent"),
  });

  await setRefreshCookie(refresh.token);
  return created({ user, accessToken });
});

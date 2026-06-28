import type { NextRequest } from "next/server";
import { handle, ok } from "@/src/server/http/respond";
import { rotateRefresh } from "@/src/server/services/auth-service";
import { readRefreshCookie, setRefreshCookie } from "@/src/server/auth/cookies";
import { enforceRateLimit, clientIp } from "@/src/server/security/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async (req: NextRequest) => {
  const ip = clientIp(req);
  await enforceRateLimit("refresh", ip, 60, "5 m");

  const current = await readRefreshCookie();
  const { accessToken, refresh } = await rotateRefresh(current, {
    ip,
    userAgent: req.headers.get("user-agent"),
  });

  await setRefreshCookie(refresh.token);
  return ok({ accessToken });
});

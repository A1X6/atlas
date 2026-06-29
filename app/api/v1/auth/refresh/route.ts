import type { NextRequest } from "next/server";
import { handle, ok } from "@/src/server/http/respond";
import { rotateRefresh } from "@/src/server/services/auth-service";
import { readRefreshCookie, setRefreshCookie, setSessionCookie } from "@/src/server/auth/cookies";
import { verifyAccessToken } from "@/src/server/auth/tokens";
import { signIdentity } from "@/src/server/auth/identity";
import { getEnv } from "@/src/server/env";
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
  // Keep the web identity cookie sliding in step with the refresh token.
  const claims = await verifyAccessToken(accessToken);
  const identity = await signIdentity(
    { sub: claims.sub, role: claims.role },
    getEnv().REFRESH_TOKEN_TTL_DAYS,
  );
  if (identity) await setSessionCookie(identity);

  return ok({ accessToken });
});

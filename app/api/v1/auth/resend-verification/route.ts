import type { NextRequest } from "next/server";
import { handle, ok } from "@/src/server/http/respond";
import { getAuth } from "@/src/server/auth/guards";
import { sendEmailVerification } from "@/src/server/services/auth-service";
import { enforceRateLimit, clientIp } from "@/src/server/security/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async (req: NextRequest) => {
  const { sub } = await getAuth(req);
  await enforceRateLimit("resend-verification", clientIp(req), 3, "15 m");
  await sendEmailVerification(sub);
  return ok({ sent: true });
});

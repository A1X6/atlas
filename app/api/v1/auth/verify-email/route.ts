import type { NextRequest } from "next/server";
import { handle, ok } from "@/src/server/http/respond";
import { ValidationError } from "@/src/server/http/errors";
import { verifyEmailSchema } from "@/src/server/validation/auth-schemas";
import { verifyEmail } from "@/src/server/services/auth-service";
import { enforceRateLimit, clientIp } from "@/src/server/security/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async (req: NextRequest) => {
  await enforceRateLimit("verify-email", clientIp(req), 20, "10 m");
  const body = await req.json().catch(() => {
    throw new ValidationError("Invalid JSON body");
  });
  const { token } = verifyEmailSchema.parse(body);
  const verified = await verifyEmail(token);
  return ok({ verified });
});

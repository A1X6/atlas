import type { NextRequest } from "next/server";
import { handle, ok } from "@/src/server/http/respond";
import { ValidationError } from "@/src/server/http/errors";
import { forgotPasswordSchema } from "@/src/server/validation/auth-schemas";
import { requestPasswordReset } from "@/src/server/services/auth-service";
import { enforceRateLimit, clientIp } from "@/src/server/security/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async (req: NextRequest) => {
  await enforceRateLimit("forgot-password", clientIp(req), 5, "15 m");
  const body = await req.json().catch(() => {
    throw new ValidationError("Invalid JSON body");
  });
  const { email } = forgotPasswordSchema.parse(body);
  await requestPasswordReset(email);
  // Always return success — never reveal whether an account exists.
  return ok({ sent: true });
});

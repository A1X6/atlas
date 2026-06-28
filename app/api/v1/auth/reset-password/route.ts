import type { NextRequest } from "next/server";
import { handle, ok } from "@/src/server/http/respond";
import { ValidationError } from "@/src/server/http/errors";
import { resetPasswordSchema } from "@/src/server/validation/auth-schemas";
import { resetPassword } from "@/src/server/services/auth-service";
import { enforceRateLimit, clientIp } from "@/src/server/security/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async (req: NextRequest) => {
  await enforceRateLimit("reset-password", clientIp(req), 10, "15 m");
  const body = await req.json().catch(() => {
    throw new ValidationError("Invalid JSON body");
  });
  const { token, password } = resetPasswordSchema.parse(body);
  const success = await resetPassword(token, password);
  return ok({ success });
});

import type { NextRequest } from "next/server";
import { handle, ok } from "@/src/server/http/respond";
import { ValidationError } from "@/src/server/http/errors";
import { getAuth } from "@/src/server/auth/guards";
import { confirmPhoneSchema } from "@/src/server/validation/account-schemas";
import { confirmPhoneVerification } from "@/src/server/services/phone-service";
import { enforceRateLimit, clientIp } from "@/src/server/security/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async (req: NextRequest) => {
  const { sub } = await getAuth(req);
  await enforceRateLimit("phone-confirm", `${sub}:${clientIp(req)}`, 10, "15 m");
  const body = await req.json().catch(() => {
    throw new ValidationError("Invalid JSON body");
  });
  const { countryCode, number, code } = confirmPhoneSchema.parse(body);
  const verified = await confirmPhoneVerification(sub, countryCode, number, code);
  return ok({ verified });
});

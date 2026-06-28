import type { NextRequest } from "next/server";
import { handle, ok } from "@/src/server/http/respond";
import { ValidationError } from "@/src/server/http/errors";
import { getAuth } from "@/src/server/auth/guards";
import { requestPhoneCodeSchema } from "@/src/server/validation/account-schemas";
import { requestPhoneVerification } from "@/src/server/services/phone-service";
import { enforceRateLimit, clientIp } from "@/src/server/security/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async (req: NextRequest) => {
  const { sub } = await getAuth(req);
  await enforceRateLimit("phone-request-code", `${sub}:${clientIp(req)}`, 3, "15 m");
  const body = await req.json().catch(() => {
    throw new ValidationError("Invalid JSON body");
  });
  const { countryCode, number } = requestPhoneCodeSchema.parse(body);
  await requestPhoneVerification(sub, countryCode, number);
  // Always report success — don't reveal which numbers exist / are verified.
  return ok({ sent: true });
});

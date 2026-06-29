import type { NextRequest } from "next/server";
import { handle, ok } from "@/src/server/http/respond";
import { getAuth } from "@/src/server/auth/guards";
import {
  sendEmailVerification,
  resendVerificationForCredentials,
} from "@/src/server/services/auth-service";
import { loginSchema } from "@/src/server/validation/auth-schemas";
import { enforceRateLimit, clientIp } from "@/src/server/security/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async (req: NextRequest) => {
  await enforceRateLimit("resend-verification", clientIp(req), 3, "15 m");

  const body = await req.json().catch(() => null);

  // Pre-session path (login screen): the caller proves ownership with
  // email + password, so we can resend without a session. Always returns ok,
  // regardless of whether the account exists / the email is already verified
  // (no account enumeration).
  const credentials = loginSchema.safeParse(body);
  if (credentials.success) {
    await resendVerificationForCredentials(credentials.data.email, credentials.data.password);
    return ok({ sent: true });
  }

  // Authenticated path (account page): resend for the signed-in user. An
  // optional `email` targets a specific owned, unverified address so a user
  // with several unverified emails can verify each one individually.
  const { sub } = await getAuth(req);
  const address = typeof body?.email === "string" ? body.email : undefined;
  await sendEmailVerification(sub, address);
  return ok({ sent: true });
});

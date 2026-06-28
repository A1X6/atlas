import type { NextRequest } from "next/server";
import { handle, created } from "@/src/server/http/respond";
import { ValidationError } from "@/src/server/http/errors";
import { registerSchema } from "@/src/server/validation/auth-schemas";
import { registerUser } from "@/src/server/services/auth-service";
import { enforceRateLimit, clientIp } from "@/src/server/security/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async (req: NextRequest) => {
  await enforceRateLimit("register", clientIp(req), 5, "10 m");

  const body = await req.json().catch(() => {
    throw new ValidationError("Invalid JSON body");
  });
  const input = registerSchema.parse(body);

  // No session is issued — the account must verify its email before signing in.
  const { user } = await registerUser(input);
  return created({ user });
});

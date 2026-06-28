import type { NextRequest } from "next/server";
import { handle, created } from "@/src/server/http/respond";
import { ValidationError } from "@/src/server/http/errors";
import { contactSchema } from "@/src/server/validation/product-schemas";
import { submitContactMessage } from "@/src/server/services/contact-service";
import { enforceRateLimit, clientIp } from "@/src/server/security/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/contact — public; rate-limited to deter spam/abuse.
export const POST = handle(async (req: NextRequest) => {
  await enforceRateLimit("contact", clientIp(req), 5, "10 m");
  const body = await req.json().catch(() => {
    throw new ValidationError("Invalid JSON body");
  });
  const input = contactSchema.parse(body);
  await submitContactMessage(input);
  return created({ received: true });
});

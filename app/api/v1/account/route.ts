import type { NextRequest } from "next/server";
import { handle, ok } from "@/src/server/http/respond";
import { ValidationError } from "@/src/server/http/errors";
import { getAuth } from "@/src/server/auth/guards";
import { updateAccountSchema } from "@/src/server/validation/account-schemas";
import { updateAccount } from "@/src/server/services/account-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = handle(async (req: NextRequest) => {
  const { sub } = await getAuth(req);
  const body = await req.json().catch(() => {
    throw new ValidationError("Invalid JSON body");
  });
  const input = updateAccountSchema.parse(body);
  const user = await updateAccount(sub, input);
  return ok({ user });
});

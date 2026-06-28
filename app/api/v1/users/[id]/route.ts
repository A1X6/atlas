import type { NextRequest } from "next/server";
import { handle, ok } from "@/src/server/http/respond";
import { ValidationError } from "@/src/server/http/errors";
import { requireRole } from "@/src/server/auth/guards";
import { adminUpdateUserSchema } from "@/src/server/validation/user-admin-schemas";
import { updateUserAsAdmin } from "@/src/server/services/user-admin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/v1/users/:id — admin only. Edit another user's role / basic fields.
export const PATCH = handle(async (req: NextRequest, ctx: Ctx) => {
  const { sub } = await requireRole(req, "ADMIN");
  const { id } = await ctx.params;
  const body = await req.json().catch(() => {
    throw new ValidationError("Invalid JSON body");
  });
  const input = adminUpdateUserSchema.parse(body);
  const user = await updateUserAsAdmin(sub, id, input);
  return ok({ user });
});

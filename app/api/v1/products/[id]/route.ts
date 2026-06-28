import type { NextRequest } from "next/server";
import { handle, ok, noContent } from "@/src/server/http/respond";
import { ValidationError } from "@/src/server/http/errors";
import { requireRole } from "@/src/server/auth/guards";
import { updateProductSchema } from "@/src/server/validation/product-schemas";
import {
  getProductById,
  updateProduct,
  deleteProduct,
} from "@/src/server/services/product-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/v1/products/:id — admin (full record incl. drafts). Public catalogue
// uses slug pages rendered server-side, so this is an admin-facing fetch.
export const GET = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireRole(req, "ADMIN");
  const { id } = await ctx.params;
  const product = await getProductById(id);
  return ok({ product });
});

export const PATCH = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireRole(req, "ADMIN");
  const { id } = await ctx.params;
  const body = await req.json().catch(() => {
    throw new ValidationError("Invalid JSON body");
  });
  const input = updateProductSchema.parse(body);
  const product = await updateProduct(id, input);
  return ok({ product });
});

export const DELETE = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireRole(req, "ADMIN");
  const { id } = await ctx.params;
  await deleteProduct(id);
  return noContent();
});

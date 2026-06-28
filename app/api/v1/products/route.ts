import type { NextRequest } from "next/server";
import { handle, ok, created } from "@/src/server/http/respond";
import { ValidationError } from "@/src/server/http/errors";
import { getOptionalAuth, requireRole } from "@/src/server/auth/guards";
import {
  productQuerySchema,
  createProductSchema,
} from "@/src/server/validation/product-schemas";
import { listProducts, createProduct } from "@/src/server/services/product-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/products — public list. Admins additionally see non-published items.
export const GET = handle(async (req: NextRequest) => {
  const claims = await getOptionalAuth(req);
  const includeAllStatuses = claims?.role === "ADMIN";

  const query = productQuerySchema.parse(
    Object.fromEntries(new URL(req.url).searchParams),
  );
  const result = await listProducts(query, { includeAllStatuses });
  return ok(result);
});

// POST /api/v1/products — admin only.
export const POST = handle(async (req: NextRequest) => {
  await requireRole(req, "ADMIN");
  const body = await req.json().catch(() => {
    throw new ValidationError("Invalid JSON body");
  });
  const input = createProductSchema.parse(body);
  const product = await createProduct(input);
  return created({ product });
});

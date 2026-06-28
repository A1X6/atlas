import type { NextRequest } from "next/server";
import { handle, ok } from "@/src/server/http/respond";
import { ValidationError } from "@/src/server/http/errors";
import { requireRole } from "@/src/server/auth/guards";
import { bulkActionSchema } from "@/src/server/validation/product-schemas";
import { bulkAction } from "@/src/server/services/product-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/products/bulk — admin bulk publish/draft/delete.
export const POST = handle(async (req: NextRequest) => {
  await requireRole(req, "ADMIN");
  const body = await req.json().catch(() => {
    throw new ValidationError("Invalid JSON body");
  });
  const input = bulkActionSchema.parse(body);
  const result = await bulkAction(input);
  return ok(result);
});

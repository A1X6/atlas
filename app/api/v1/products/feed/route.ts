import type { NextRequest } from "next/server";
import { handle, ok } from "@/src/server/http/respond";
import { getOptionalAuth } from "@/src/server/auth/guards";
import { productFeedSchema } from "@/src/server/validation/product-schemas";
import { listProductFeed } from "@/src/server/services/product-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/products/feed — cursor-paginated product feed (infinite scroll).
// Returns { items, nextCursor }; pass nextCursor back as ?cursor= for the next page.
export const GET = handle(async (req: NextRequest) => {
  const claims = await getOptionalAuth(req);
  const includeAllStatuses = claims?.role === "ADMIN";
  const query = productFeedSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const result = await listProductFeed(query, { includeAllStatuses });
  return ok(result);
});

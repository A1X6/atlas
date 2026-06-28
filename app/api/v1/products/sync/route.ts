import type { NextRequest } from "next/server";
import { handle, ok } from "@/src/server/http/respond";
import { requireRole } from "@/src/server/auth/guards";
import { enforceRateLimit, clientIp } from "@/src/server/security/ratelimit";
import { fetchExternalProducts } from "@/src/server/external/dummyjson";
import { syncProductsFromExternal } from "@/src/server/services/product-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/products/sync — admin pulls the external catalogue into our DB.
// Resilience (timeout/retry/circuit-breaker) lives in the external client; a
// failure here surfaces as 503 while existing DB data keeps serving the app.
export const POST = handle(async (req: NextRequest) => {
  await requireRole(req, "ADMIN");
  await enforceRateLimit("sync", clientIp(req), 5, "5 m");

  const { products, skipped } = await fetchExternalProducts(30);
  const result = await syncProductsFromExternal(products, skipped);
  return ok(result);
});

import { handle, ok } from "@/src/server/http/respond";
import { listCategories } from "@/src/server/services/product-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/products/categories — public; powers the catalogue filter chips.
// Low-churn data, so allow shared (CDN) caching with stale-while-revalidate.
export const GET = handle(async () => {
  const categories = await listCategories();
  return ok(
    { categories },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
});

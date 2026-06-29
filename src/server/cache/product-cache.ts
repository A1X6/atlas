import "server-only";
import { unstable_cache } from "next/cache";
import {
  getPublishedProductBySlug,
  listCategories,
  listProducts,
} from "@/src/server/services/product-service";

/**
 * Next-coupled caching adapter for the PUBLIC catalogue surfaces.
 *
 * It intentionally sits OUTSIDE the framework-agnostic services/repositories:
 * it wraps them with Next's `unstable_cache` so the server-rendered public
 * pages don't hit the database on every request. The portable core stays
 * Next-free (a mobile BFF would cache differently and wouldn't import this).
 *
 * Every entry is tagged `"products"`, so product mutations can call
 * `revalidateTag("products")` for instant invalidation; until then entries
 * refresh on their own time window (the prior ISR behaviour).
 */

type ProductQuery = Parameters<typeof listProducts>[0];

/** Cache tag shared by all public-catalogue cache entries. */
export const PRODUCTS_CACHE_TAG = "products";

/** Public, published-only product list (keyed by the full query object). */
export const getCachedPublicProducts = unstable_cache(
  (query: ProductQuery) => listProducts(query, { includeAllStatuses: false }),
  ["public-products"],
  { revalidate: 60, tags: [PRODUCTS_CACHE_TAG] },
);

/** Distinct category list for the filter chips (changes rarely). */
export const getCachedCategories = unstable_cache(
  () => listCategories(),
  ["product-categories"],
  { revalidate: 300, tags: [PRODUCTS_CACHE_TAG] },
);

/** A single published product by slug (powers the detail page + its metadata). */
export const getCachedPublishedProductBySlug = unstable_cache(
  (slug: string) => getPublishedProductBySlug(slug),
  ["published-product-by-slug"],
  { revalidate: 300, tags: [PRODUCTS_CACHE_TAG] },
);

import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { listProducts, listCategories } from "@/src/server/services/product-service";
import { productQuerySchema } from "@/src/server/validation/product-schemas";
import { ProductCard } from "@/src/ui/ProductCard";
import { ErrorState, ProductGridSkeleton } from "@/src/ui/states";
import { buildAlternates } from "@/src/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalogue" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates(locale, "/products"),
  };
}

// SSR per request so search/filter params are honored and pages stay crawlable.
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 12;

type Query = ReturnType<typeof productQuerySchema.parse>;

// Shared href builder for the filter chips and pagination links.
function buildProductsHref(query: Query, overrides: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("category", query.category);
  if (query.sort && query.sort !== "newest") params.set("sort", query.sort);
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined || v === "") params.delete(k);
    else params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `/products?${s}` : "/products";
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "catalogue" });

  const sp = await searchParams;
  // Normalize repeated params (string[]) to a single value before validation.
  const norm = Object.fromEntries(
    Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const parsed = productQuerySchema.safeParse({ ...norm, pageSize: PAGE_SIZE });
  const query = parsed.success ? parsed.data : productQuerySchema.parse({ pageSize: PAGE_SIZE });

  // Categories are independent of the page/filter, so fetch them here (fast,
  // distinct query) and keep the filter UI stable across navigations.
  let categories: string[] = [];
  try {
    categories = await listCategories();
  } catch {
    // Non-fatal: the catalogue still renders without the category chips.
  }

  // Re-mounting the Suspense boundary on any query change re-shows the skeleton.
  const suspenseKey = `${query.q ?? ""}|${query.category ?? ""}|${query.sort ?? "newest"}|${query.page ?? 1}`;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-text">{t("title")}</h1>
        <p className="mt-2 text-[15px] text-text-2">{t("subtitle")}</p>
      </header>

      {/* Filters (GET form → server-rendered, no JS required, crawlable) */}
      <form method="get" className="mb-6 flex flex-wrap items-center gap-3">
        <input
          name="q"
          defaultValue={query.q ?? ""}
          placeholder={t("searchPlaceholder")}
          className="h-9 w-full max-w-xs rounded-lg border border-border-strong bg-surface px-3 text-sm text-text outline-none focus:border-accent sm:w-auto"
        />
        {query.category && <input type="hidden" name="category" value={query.category} />}
        <select
          name="sort"
          defaultValue={query.sort}
          className="h-9 rounded-lg border border-border-strong bg-surface px-2 text-sm text-text outline-none"
        >
          <option value="newest">{t("sortNewest")}</option>
          <option value="price_asc">{t("sortPriceAsc")}</option>
          <option value="price_desc">{t("sortPriceDesc")}</option>
          <option value="name">{t("sortName")}</option>
        </select>
        <button type="submit" className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-hover">
          {t("apply")}
        </button>
      </form>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href={buildProductsHref(query, { category: undefined, page: undefined })}
            className={`h-8 rounded-full px-3 text-xs leading-8 ${!query.category ? "bg-accent text-on-accent" : "border border-border-strong bg-surface text-text-2 hover:bg-surface-3"}`}
          >
            {t("categoryAll")}
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={buildProductsHref(query, { category: c, page: undefined })}
              className={`h-8 rounded-full px-3 text-xs capitalize leading-8 ${query.category === c ? "bg-accent text-on-accent" : "border border-border-strong bg-surface text-text-2 hover:bg-surface-3"}`}
            >
              {c}
            </Link>
          ))}
        </div>
      )}

      {/* Results stream in behind a shimmer skeleton; the key re-mounts the
          boundary on every page/filter change so the skeleton shows each time. */}
      <Suspense key={suspenseKey} fallback={<ProductGridSkeleton count={PAGE_SIZE} />}>
        <ProductResults locale={locale} query={query} />
      </Suspense>
    </div>
  );
}

async function ProductResults({ locale, query }: { locale: string; query: Query }) {
  const t = await getTranslations({ locale, namespace: "catalogue" });

  // Declared without `| null`: the catch always returns, so past the try/catch
  // TypeScript treats `result` as definitely assigned.
  let result: Awaited<ReturnType<typeof listProducts>>;
  try {
    result = await listProducts(query, { includeAllStatuses: false });
  } catch {
    return (
      <ErrorState
        title={t("errorTitle")}
        body={t("errorBody")}
        statusLabel={t("statusPage")}
        statusHref="/api/v1/health"
      />
    );
  }

  if (result.items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-10 text-center">
        <h2 className="text-base font-semibold text-text">{t("emptyTitle")}</h2>
        <p className="mt-1 text-sm text-text-2">{t("emptyBody")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {result.totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2">
          {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={buildProductsHref(query, { page: n === 1 ? undefined : n })}
              aria-current={n === result.page ? "page" : undefined}
              className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm ${n === result.page ? "bg-accent text-on-accent" : "border border-border-strong bg-surface text-text hover:bg-surface-3"}`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}

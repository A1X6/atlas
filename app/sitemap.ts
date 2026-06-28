import type { MetadataRoute } from "next";
import { listProducts } from "@/src/server/services/product-service";
import { getPathname } from "@/src/i18n/navigation";
import { routing } from "@/src/i18n/routing";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

// Build a sitemap entry whose canonical URL is the default locale and which lists
// every locale under alternates.languages (hreflang) for proper multilingual SEO.
function localizedEntry(
  href: string,
  extra: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">,
): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((locale) => [locale, APP_URL + getPathname({ locale, href })]),
  );
  languages["x-default"] = APP_URL + getPathname({ locale: routing.defaultLocale, href });
  return {
    url: APP_URL + getPathname({ locale: routing.defaultLocale, href }),
    alternates: { languages },
    ...extra,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/products", "/about", "/contact", "/privacy", "/terms"].map((path) =>
    localizedEntry(path, {
      lastModified: new Date(),
      changeFrequency: path === "" || path === "/products" ? "daily" : "monthly",
      priority: path === "" ? 1 : 0.7,
    }),
  );

  // Include published products; degrade gracefully if the DB is unavailable.
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const { items } = await listProducts(
      { page: 1, pageSize: 50, sort: "newest" },
      { includeAllStatuses: false },
    );
    productRoutes = items.map((p) =>
      localizedEntry(`/products/${p.slug}`, {
        lastModified: new Date(p.updatedAt),
        changeFrequency: "weekly",
        priority: 0.6,
      }),
    );
  } catch {
    productRoutes = [];
  }

  return [...staticRoutes, ...productRoutes];
}

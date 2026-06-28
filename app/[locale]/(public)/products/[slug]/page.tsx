import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, getFormatter, setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { getPublishedProductBySlug } from "@/src/server/services/product-service";
import { StatusBadge } from "@/src/ui/primitives";
import { absoluteUrl, buildAlternates } from "@/src/lib/seo";
import type { Product } from "@/src/lib/types";

// On-demand ISR: detail pages are generated on first request, then cached.
export const revalidate = 300;

type Params = Promise<{ locale: string; slug: string }>;

// Memoize within a request so generateMetadata + the page share one query.
const getProduct = cache(async (slug: string): Promise<Product | null> => {
  try {
    return await getPublishedProductBySlug(slug);
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "catalogue" });
  const product = await getProduct(slug);
  if (!product) return { title: t("notFoundTitle") };
  return {
    title: product.name,
    description:
      product.description ||
      t("metaDescriptionFallback", { name: product.name, category: product.category }),
    alternates: buildAlternates(locale, `/products/${product.slug}`),
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.imageUrl ? [product.imageUrl] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "catalogue" });
  const format = await getFormatter({ locale });
  const product = await getProduct(slug);
  if (!product) notFound();
  const priceLabel = format.number(product.priceCents / 100, {
    style: "currency",
    currency: product.currency,
  });

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      category: product.category,
      sku: product.sku ?? undefined,
      image: product.imageUrl ?? undefined,
      offers: {
        "@type": "Offer",
        price: (product.priceCents / 100).toFixed(2),
        priceCurrency: product.currency,
        availability:
          product.status === "OUT_OF_STOCK"
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: t("breadcrumbProducts"),
          item: absoluteUrl(`/${locale}/products`),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: product.name,
          item: absoluteUrl(`/${locale}/products/${product.slug}`),
        },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="mb-6 text-sm text-text-3">
        <Link href="/products" className="hover:text-text">
          {t("breadcrumbProducts")}
        </Link>{" "}
        / <span className="text-text-2">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div
          className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border"
          style={{ background: "var(--surface-3)" }}
        >
          {product.imageUrl && (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-cover"
              priority
            />
          )}
        </div>
        <div>
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-text-3">
            {product.category}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-text">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-2xl font-semibold text-accent">{priceLabel}</span>
            <StatusBadge status={product.status} />
          </div>
          <p className="mt-5 text-[15px] leading-relaxed text-text-2">{product.description}</p>
          {product.sku && (
            <p className="mt-6 font-mono text-xs text-text-3">{t("skuLabel")}: {product.sku}</p>
          )}
        </div>
      </div>
    </div>
  );
}

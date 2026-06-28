import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { absoluteUrl, buildAlternates } from "@/src/lib/seo";
import { Button } from "@/src/ui/primitives";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates(locale, ""),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });

  const features = [
    { title: t("feature1Title"), body: t("feature1Body") },
    { title: t("feature2Title"), body: t("feature2Body") },
    { title: t("feature3Title"), body: t("feature3Body") },
    { title: t("feature4Title"), body: t("feature4Body") },
  ];

  // Site-level structured data for richer search presentation.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Atlas",
      url: absoluteUrl(`/${locale}`),
      logo: absoluteUrl("/icon.svg"),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Atlas",
      url: absoluteUrl(`/${locale}`),
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: absoluteUrl(`/${locale}/products?q={search_term_string}`),
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 60% at 50% -10%, var(--accent-soft) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 py-24 text-center">
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            {t("eyebrow")}
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-text sm:text-5xl">
            {t("heroHeading")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-text-2">
            {t("heroSubheading")}
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/products">
              <Button size="lg">{t("ctaBrowse")}</Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="secondary">
                {t("ctaCreateAccount")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-5 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="text-base font-semibold text-text">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-text-2">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ShieldCheck,
  RefreshCw,
  Lock,
  Smartphone,
  Languages,
  MoonStar,
  Check,
} from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import { absoluteUrl, buildAlternates } from "@/src/lib/seo";
import { Button } from "@/src/ui/primitives";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";

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

  const heroPoints = [t("heroPoint1"), t("heroPoint2"), t("heroPoint3")];

  const stats = [
    { value: t("stat1Value"), label: t("stat1Label") },
    { value: t("stat2Value"), label: t("stat2Label") },
    { value: t("stat3Value"), label: t("stat3Label") },
    { value: t("stat4Value"), label: t("stat4Label") },
  ];

  const features = [
    { icon: ShieldCheck, title: t("feature1Title"), body: t("feature1Body") },
    { icon: RefreshCw, title: t("feature2Title"), body: t("feature2Body") },
    { icon: Lock, title: t("feature3Title"), body: t("feature3Body") },
    { icon: Smartphone, title: t("feature4Title"), body: t("feature4Body") },
    { icon: Languages, title: t("feature5Title"), body: t("feature5Body") },
    { icon: MoonStar, title: t("feature6Title"), body: t("feature6Body") },
  ];

  const steps = [
    { title: t("step1Title"), body: t("step1Body") },
    { title: t("step2Title"), body: t("step2Body") },
    { title: t("step3Title"), body: t("step3Body") },
  ];

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
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
        <div className="relative mx-auto max-w-6xl px-5 py-24 text-center sm:py-28">
          <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-accent shadow-sm">
            {t("eyebrow")}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-text sm:text-5xl">
            {t("heroHeading")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-text-2">
            {t("heroSubheading")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/products">
              <Button size="lg">{t("ctaBrowse")}</Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="secondary">
                {t("ctaCreateAccount")}
              </Button>
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-text-2">
            {heroPoints.map((point) => (
              <li key={point} className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-accent" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-border px-5 sm:grid-cols-4 sm:divide-x">
          {stats.map((s) => (
            <div key={s.label} className="px-2 py-8 text-center sm:px-6">
              <div className="text-3xl font-semibold tracking-tight text-text">
                {s.value}
              </div>
              <div className="mt-1 text-sm leading-snug text-text-2">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            {t("featuresEyebrow")}
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">
            {t("featuresHeading")}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-text-2">
            {t("featuresSubheading")}
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="gap-4 transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <CardTitle className="mt-4 text-base">{f.title}</CardTitle>
                  <CardDescription className="text-[14px] leading-relaxed text-text-2">
                    {f.body}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
              {t("stepsEyebrow")}
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">
              {t("stepsHeading")}
            </h2>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="flex size-9 items-center justify-center rounded-full border border-accent/30 bg-bg font-mono text-sm font-semibold text-accent">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-base font-semibold text-text">{step.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-text-2">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-20 sm:py-24">
        <div className="text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            {t("faqEyebrow")}
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">
            {t("faqHeading")}
          </h2>
        </div>
        <Accordion type="single" collapsible className="mt-10 w-full">
          {faqs.map((faq) => (
            <AccordionItem key={faq.q} value={faq.q}>
              <AccordionTrigger className="text-[15px] font-medium text-text">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-[14px] leading-relaxed text-text-2">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border">
        <div className="relative mx-auto max-w-6xl overflow-hidden px-5 py-20 text-center">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 70% at 50% 120%, var(--accent-soft) 0%, transparent 60%)",
            }}
          />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-text">
              {t("finalCtaHeading")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-text-2">
              {t("finalCtaSubheading")}
            </p>
            <Separator className="mx-auto mt-8 max-w-24" />
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
        </div>
      </section>
    </>
  );
}

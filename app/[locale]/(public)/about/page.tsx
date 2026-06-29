import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Layers, ShieldCheck, Languages, Smartphone } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import { buildAlternates } from "@/src/lib/seo";
import { Button } from "@/src/ui/primitives";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/components/ui/card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates(locale, "/about"),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "about" });

  const principles = [
    { icon: Layers, title: t("principle1Title"), body: t("principle1Body") },
    { icon: ShieldCheck, title: t("principle2Title"), body: t("principle2Body") },
    { icon: Languages, title: t("principle3Title"), body: t("principle3Body") },
    { icon: Smartphone, title: t("principle4Title"), body: t("principle4Body") },
  ];

  return (
    <>
      {/* Intro */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 55% at 50% -10%, var(--accent-soft) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-5 py-20 sm:py-24">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            {t("eyebrow")}
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-text">
            {t("heading")}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-text-2">{t("lead")}</p>
        </div>
      </section>

      {/* Narrative */}
      <section className="mx-auto max-w-3xl px-5 py-16">
        <div className="space-y-4 text-[15px] leading-relaxed text-text-2">
          <p>{t("paragraph1")}</p>
          <p>{t("paragraph2")}</p>
          <p>{t("paragraph3")}</p>
        </div>
      </section>

      {/* Principles */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
              {t("principlesEyebrow")}
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">
              {t("principlesHeading")}
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {principles.map((p) => {
              const Icon = p.icon;
              return (
                <Card key={p.title} className="gap-4">
                  <CardHeader>
                    <div className="flex size-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                      <Icon className="size-5" aria-hidden />
                    </div>
                    <CardTitle className="mt-4 text-base">{p.title}</CardTitle>
                    <CardDescription className="text-[14px] leading-relaxed text-text-2">
                      {p.body}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-text">
          {t("ctaHeading")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-text-2">
          {t("ctaBody")}
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/products">
            <Button size="lg">{t("ctaPrimary")}</Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="secondary">
              {t("ctaSecondary")}
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock, ListChecks, UserRound } from "lucide-react";
import { buildAlternates } from "@/src/lib/seo";
import { ContactForm } from "@/src/ui/ContactForm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates(locale, "/contact"),
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "contact" });

  const info = [
    { icon: Clock, title: t("info1Title"), body: t("info1Body") },
    { icon: ListChecks, title: t("info2Title"), body: t("info2Body") },
    { icon: UserRound, title: t("info3Title"), body: t("info3Body") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left: intro + expectations */}
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            {t("eyebrow")}
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-text">
            {t("heading")}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-text-2">{t("subtitle")}</p>

          <ul className="mt-10 space-y-6">
            {info.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-text">{item.title}</h2>
                    <p className="mt-1 text-[14px] leading-relaxed text-text-2">
                      {item.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right: form */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">{t("formTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/src/lib/seo";
import { LegalPage } from "@/src/ui/LegalPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return {
    title: t("termsMetaTitle"),
    description: t("termsMetaDescription"),
    alternates: buildAlternates(locale, "/terms"),
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal" });

  return (
    <LegalPage
      eyebrow={t("legalEyebrow")}
      title={t("termsTitle")}
      lastUpdatedLabel={t("lastUpdatedLabel")}
      lastUpdated={t("lastUpdated")}
      intro={t("termsIntro")}
      sections={[
        { title: t("termsSection1Title"), body: t("termsSection1Body") },
        { title: t("termsSection2Title"), body: t("termsSection2Body") },
        { title: t("termsSection3Title"), body: t("termsSection3Body") },
      ]}
    />
  );
}

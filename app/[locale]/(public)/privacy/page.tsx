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
    title: t("privacyMetaTitle"),
    description: t("privacyMetaDescription"),
    alternates: buildAlternates(locale, "/privacy"),
  };
}

export default async function PrivacyPage({
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
      title={t("privacyTitle")}
      lastUpdatedLabel={t("lastUpdatedLabel")}
      lastUpdated={t("lastUpdated")}
      intro={t("privacyIntro")}
      sections={[
        { title: t("privacySection1Title"), body: t("privacySection1Body") },
        { title: t("privacySection2Title"), body: t("privacySection2Body") },
        { title: t("privacySection3Title"), body: t("privacySection3Body") },
        { title: t("privacySection4Title"), body: t("privacySection4Body") },
      ]}
    />
  );
}

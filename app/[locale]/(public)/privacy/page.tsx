import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/src/lib/seo";

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
    <article className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-text">{t("privacyTitle")}</h1>
      <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-text-2">
        <section>
          <h2 className="text-lg font-semibold text-text">{t("privacySection1Title")}</h2>
          <p className="mt-2">{t("privacySection1Body")}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-text">{t("privacySection2Title")}</h2>
          <p className="mt-2">{t("privacySection2Body")}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-text">{t("privacySection3Title")}</h2>
          <p className="mt-2">{t("privacySection3Body")}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-text">{t("privacySection4Title")}</h2>
          <p className="mt-2">{t("privacySection4Body")}</p>
        </section>
      </div>
    </article>
  );
}

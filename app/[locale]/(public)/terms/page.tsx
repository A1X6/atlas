import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

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
    alternates: {
      canonical: `/${locale}/terms`,
      languages: { en: "/en/terms", ar: "/ar/terms" },
    },
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
    <article className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-text">{t("termsTitle")}</h1>
      <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-text-2">
        <p>{t("termsIntro")}</p>
        <section>
          <h2 className="text-lg font-semibold text-text">{t("termsSection1Title")}</h2>
          <p className="mt-2">{t("termsSection1Body")}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-text">{t("termsSection2Title")}</h2>
          <p className="mt-2">{t("termsSection2Body")}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-text">{t("termsSection3Title")}</h2>
          <p className="mt-2">{t("termsSection3Body")}</p>
        </section>
      </div>
    </article>
  );
}

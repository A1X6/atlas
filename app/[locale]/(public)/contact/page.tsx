import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/src/lib/seo";
import { ContactForm } from "@/src/ui/ContactForm";

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

  return (
    <div className="mx-auto max-w-xl px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-text">{t("heading")}</h1>
      <p className="mt-3 text-[15px] text-text-2">{t("subtitle")}</p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}

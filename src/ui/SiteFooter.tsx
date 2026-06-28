import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { Logo } from "@/src/ui/Logo";

export function SiteFooter() {
  const t = useTranslations("footer");
  return (
    <footer className="mt-auto border-t border-border bg-surface-2">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="text-xs text-text-3">{t("tagline")}</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-text-2">
          <Link href="/products" className="hover:text-text">{t("products")}</Link>
          <Link href="/about" className="hover:text-text">{t("about")}</Link>
          <Link href="/contact" className="hover:text-text">{t("contact")}</Link>
          <Link href="/privacy" className="hover:text-text">{t("privacy")}</Link>
          <Link href="/terms" className="hover:text-text">{t("terms")}</Link>
        </nav>
        <p className="font-mono text-[11px] text-text-3">{t("copyright")}</p>
      </div>
    </footer>
  );
}

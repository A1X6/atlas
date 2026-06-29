import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { Button } from "@/src/ui/primitives";

// Localized 404 — rendered for notFound() and unknown localized routes
// (via the [...rest] catch-all). Runs inside the locale layout, so it's translated.
export default function NotFound() {
  const t = useTranslations("common");
  return (
    <div className="flex min-h-[70vh] flex-1 flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-bold text-accent">404</p>
      <h1 className="mt-3 text-xl font-semibold text-text">{t("notFoundTitle")}</h1>
      <p className="mt-2 max-w-sm text-sm text-text-2">{t("notFoundBody")}</p>
      <Link href="/" className="mt-6">
        <Button>{t("goHome")}</Button>
      </Link>
    </div>
  );
}

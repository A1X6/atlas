import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import { Logo } from "@/src/ui/Logo";
import { ThemeToggle } from "@/src/ui/ThemeToggle";
import { RedirectIfAuthenticated } from "@/src/ui/RedirectIfAuthenticated";

// Auth pages are public but should not be indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex items-center justify-between px-5 py-4">
        <Logo />
        <ThemeToggle />
      </header>
      <main
        className="flex flex-1 items-center justify-center px-5 py-10"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, var(--accent-soft) 0%, transparent 55%)",
        }}
      >
        <RedirectIfAuthenticated>{children}</RedirectIfAuthenticated>
      </main>
      <footer className="px-5 py-4 text-center text-xs text-text-3">
        {/* Locale-aware Link keeps the active locale; the arrow flips for RTL. */}
        <Link href="/" className="inline-flex items-center gap-1.5 hover:text-text-2">
          <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
          {t("backToAtlas")}
        </Link>
      </footer>
    </div>
  );
}

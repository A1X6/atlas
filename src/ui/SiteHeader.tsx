"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { Logo } from "@/src/ui/Logo";
import { ThemeToggle } from "@/src/ui/ThemeToggle";
import { LanguageSwitcher } from "@/src/ui/LanguageSwitcher";
import { Button } from "@/src/ui/primitives";
import { useAuth } from "@/src/lib/auth";

const navLinks = [
  { href: "/products", key: "products" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export function SiteHeader() {
  const { status, user } = useAuth();
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between gap-6 px-5">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-1.5 text-[13px] text-text-2 hover:bg-surface-3 hover:text-text"
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          {status === "authenticated" && user ? (
            <Link href="/app">
              <Button size="sm" variant="secondary">
                {user.role === "ADMIN" ? t("dashboard") : t("myProducts")}
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button size="sm" variant="ghost">
                  {t("signIn")}
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">{t("getStarted")}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

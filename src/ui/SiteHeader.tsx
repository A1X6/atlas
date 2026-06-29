"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { Logo } from "@/src/ui/Logo";
import { ThemeToggle } from "@/src/ui/ThemeToggle";
import { LanguageSwitcher } from "@/src/ui/LanguageSwitcher";
import { Button } from "@/src/ui/primitives";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/src/components/ui/sheet";
import { useAuth } from "@/src/lib/auth";

const navLinks = [
  { href: "/products", key: "products" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export function SiteHeader() {
  const { status, user, logout } = useAuth();
  const t = useTranslations("nav");
  const [menuOpen, setMenuOpen] = useState(false);

  const authed = status === "authenticated" && !!user;

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

          {/* Desktop auth actions — differ by signed-in state */}
          <div className="hidden items-center gap-2 md:flex">
            {authed ? (
              <>
                <Link href="/app">
                  <Button size="sm" variant="secondary">
                    {user.role === "ADMIN" ? t("dashboard") : t("myProducts")}
                  </Button>
                </Link>
                <Button size="sm" variant="ghost" onClick={() => logout()}>
                  {t("signOut")}
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
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

          {/* Mobile hamburger → slide-in nav + auth actions */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                aria-label={t("menu")}
                className="rounded-md p-1.5 text-text-2 hover:bg-surface-3 md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-border bg-bg p-0 text-text">
              <SheetTitle className="sr-only">{t("menu")}</SheetTitle>
              <div className="flex h-full flex-col p-4">
                <nav className="mt-6 flex flex-col gap-1">
                  {navLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-text-2 hover:bg-surface-3 hover:text-text"
                    >
                      {t(l.key)}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
                  {authed ? (
                    <>
                      <Link href="/app" onClick={() => setMenuOpen(false)}>
                        <Button className="w-full" variant="secondary">
                          {user.role === "ADMIN" ? t("dashboard") : t("myProducts")}
                        </Button>
                      </Link>
                      <Button
                        className="w-full"
                        variant="ghost"
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                      >
                        {t("signOut")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setMenuOpen(false)}>
                        <Button className="w-full" variant="ghost">
                          {t("signIn")}
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setMenuOpen(false)}>
                        <Button className="w-full">{t("getStarted")}</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

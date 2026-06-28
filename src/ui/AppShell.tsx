"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/src/i18n/navigation";
import { Logo } from "@/src/ui/Logo";
import { ThemeToggle } from "@/src/ui/ThemeToggle";
import { LanguageSwitcher } from "@/src/ui/LanguageSwitcher";
import { Spinner, RoleBadge } from "@/src/ui/primitives";
import { useAuth } from "@/src/lib/auth";
import type { Role } from "@/src/lib/types";

type NavItem = { href: string; key: string; roles: Role[] };

const NAV: NavItem[] = [
  { href: "/app/dashboard", key: "dashboard", roles: ["ADMIN"] },
  { href: "/app/products", key: "products", roles: ["ADMIN", "USER"] },
  { href: "/app/management", key: "management", roles: ["ADMIN"] },
  { href: "/app/users", key: "users", roles: ["ADMIN"] },
  { href: "/app/account", key: "account", roles: ["ADMIN", "USER"] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { status, user, logout } = useAuth();
  const t = useTranslations("app");
  const tc = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();

  // Client-side guard for UX; the API independently enforces real authorization.
  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && user?.role === "USER") {
      const adminOnly = NAV.filter((n) => !n.roles.includes("USER")).map((n) => n.href);
      if (adminOnly.some((href) => pathname === href || pathname.startsWith(href + "/"))) {
        router.replace("/app/products");
      }
    }
  }, [status, user, pathname, router]);

  if (status !== "authenticated" || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Spinner className="h-6 w-6 text-accent" />
      </div>
    );
  }

  const items = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="hidden w-56 flex-none flex-col border-s border-border bg-surface-2 p-3 md:flex">
        <div className="px-2 py-2.5">
          <Logo href="/app" />
        </div>
        <nav className="mt-2 flex flex-1 flex-col gap-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-[13px] font-medium ${active ? "bg-accent-soft text-accent" : "text-text-2 hover:bg-surface-3 hover:text-text"}`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex items-center gap-2.5 border-t border-border px-2 pt-3">
          <span className="h-8 w-8 flex-none rounded-full bg-gradient-to-br from-accent to-[#60a5fa]" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-medium text-text">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-[10px] text-text-3">{user.role === "ADMIN" ? tc("role_admin") : tc("role_user")}</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 flex-none items-center justify-between border-b border-border bg-surface px-5">
          {/* Mobile nav */}
          <nav className="flex items-center gap-1 md:hidden">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${active ? "bg-accent-soft text-accent" : "text-text-2"}`}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>
          <div className="hidden md:block">
            <RoleBadge role={user.role} />
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              onClick={() => logout()}
              className="rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-[13px] text-text hover:bg-surface-3"
            >
              {t("signOut")}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-5">{children}</main>
      </div>
    </div>
  );
}

"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

/**
 * Theme toggle. The two icons are driven purely by the `dark:` CSS variant
 * (which follows next-themes' `.dark` class), so server and client markup are
 * identical — no hydration mismatch. The click handler reads `resolvedTheme`
 * (available after mount) to flip between light and dark.
 */
export function ThemeToggle({ className, label }: { className?: string; label?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("common");
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={label ?? t("toggleTheme")}
      className={
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-strong bg-surface text-text-2 hover:bg-surface-3 hover:text-text transition-colors " +
        (className ?? "")
      }
    >
      {/* moon — shown in light mode (click to go dark) */}
      <svg className="h-4 w-4 dark:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {/* sun — shown in dark mode (click to go light) */}
      <svg className="hidden h-4 w-4 dark:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" strokeLinecap="round" />
      </svg>
    </button>
  );
}

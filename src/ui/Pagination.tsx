"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/src/lib/utils";

/** Compact numbered page range: first, last, current ±1, with ellipses. */
function pageRange(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) out.push("…");
  for (let p = start; p <= end; p++) out.push(p);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}

const btnBase =
  "flex h-8 min-w-8 items-center justify-center rounded-lg border border-border-strong bg-surface px-2 text-sm text-text-2 disabled:opacity-40 hover:enabled:bg-surface-2";

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const t = useTranslations("common");
  const isRtl = useLocale() === "ar";
  if (totalPages <= 1) return null;

  const Prev = isRtl ? ChevronRight : ChevronLeft;
  const Next = isRtl ? ChevronLeft : ChevronRight;

  return (
    <nav className="flex items-center gap-1.5" aria-label={t("pagination")}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label={t("prevPage")}
        className={btnBase}
      >
        <Prev className="h-4 w-4" />
      </button>

      {pageRange(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-text-3" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={t("goToPage", { page: p })}
            className={cn(
              btnBase,
              p === page && "border-accent-line bg-accent-soft font-medium text-accent",
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label={t("nextPage")}
        className={btnBase}
      >
        <Next className="h-4 w-4" />
      </button>
    </nav>
  );
}

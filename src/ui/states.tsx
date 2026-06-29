/**
 * Shared loading + error state views (design spec §4.6 "States" and §2.7
 * "Skeleton loaders"). Presentational only — callers pass already-translated
 * strings and handlers, so this module stays usable from both server
 * components (route-level loading.tsx) and client components (data views).
 *
 * All skeletons use the `.skeleton` shimmer helper from globals.css
 * (`shimmer 1.4s infinite linear`, design spec §1.4 Motion).
 */

import { TriangleAlert } from "lucide-react";
import { cn } from "@/src/lib/utils";

// Base shimmer placeholder block.
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded", className)} />;
}

// Card-grid skeleton: image block + 3 text bars (50 / 80 / 35% widths) — §2.7.
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border">
          <Skeleton className="h-32 w-full rounded-none" />
          <div className="space-y-2 p-3.5">
            <Skeleton className="h-2.5 w-1/2" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Table-row skeleton: optional checkbox + avatar/thumb + 2 bars + pill — §2.7.
export function TableRowsSkeleton({
  rows = 6,
  withCheckbox = false,
}: {
  rows?: number;
  withCheckbox?: boolean;
}) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          {withCheckbox && <Skeleton className="h-[18px] w-[18px] rounded-[5px]" />}
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Admin dashboard skeleton: KPI grid + 2 charts + activity feed — §4.6 Loading.
export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-5xl">
      <Skeleton className="h-7 w-44" />
      <Skeleton className="mt-2.5 h-4 w-64" />
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-24" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-40 w-full rounded-lg" />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <Skeleton className="h-4 w-28" />
          <div className="mt-4 flex items-center gap-5">
            <Skeleton className="h-[104px] w-[104px] rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-border bg-surface p-5">
        <Skeleton className="h-4 w-28" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Error card: danger border, ! icon, title + optional mono code, body, and
// Retry + Status page actions — §4.6 Error.
export function ErrorState({
  title,
  body,
  code,
  retryLabel,
  onRetry,
  statusLabel,
  statusHref,
}: {
  title: string;
  body?: string;
  code?: string | number;
  retryLabel?: string;
  onRetry?: () => void;
  statusLabel?: string;
  statusHref?: string;
}) {
  return (
    <div className="rounded-xl border border-danger-bd bg-surface p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-danger-bd bg-danger-soft text-danger">
        <TriangleAlert className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-text">
        {title}
        {code != null && code !== "" && (
          <span className="ms-2 font-mono text-[13px] font-normal text-text-3">({code})</span>
        )}
      </h2>
      {body && <p className="mt-1 text-sm text-text-2">{body}</p>}
      {(onRetry || statusHref) && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover"
            >
              {retryLabel}
            </button>
          )}
          {statusHref && (
            // JSON health endpoint, not an app page — open in a new tab.
            <a
              href={statusHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2"
            >
              {statusLabel}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

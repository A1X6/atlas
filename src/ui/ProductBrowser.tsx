"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api } from "@/src/lib/api";
import type { Product } from "@/src/lib/types";
import { ProductCard } from "@/src/ui/ProductCard";

type Feed = { items: Product[]; nextCursor: string | null };

export function ProductBrowser() {
  const t = useTranslations("browse");
  const [q, setQ] = useState("");

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["product-feed", { q }],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: "9" });
      if (q) params.set("q", q);
      if (pageParam) params.set("cursor", pageParam);
      return api<Feed>(`/products/feed?${params.toString()}`, { auth: false });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-text">{t("title")}</h1>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-9 w-full max-w-xs rounded-lg border border-border-strong bg-surface px-3 text-sm text-text outline-none focus:border-accent"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border">
              <div className="skeleton h-32 w-full" />
              <div className="space-y-2 p-3.5">
                <div className="skeleton h-2.5 w-1/2 rounded" />
                <div className="skeleton h-3 w-4/5 rounded" />
                <div className="skeleton h-2.5 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-danger-bd bg-surface p-10 text-center">
          <h2 className="text-base font-semibold text-text">{t("fetchErrorTitle")}</h2>
          <p className="mt-1 text-sm text-text-2">{t("fetchErrorBody")}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover"
          >
            {t("retry")}
          </button>
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {hasNextPage && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="h-10 rounded-lg border border-border-strong bg-surface px-5 text-sm font-medium text-text hover:bg-surface-3 disabled:opacity-50"
              >
                {isFetchingNextPage ? t("loading") : t("loadMore")}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <h2 className="text-base font-semibold text-text">{t("emptyTitle")}</h2>
          <p className="mt-1 text-sm text-text-2">{t("emptyBody")}</p>
        </div>
      )}
    </div>
  );
}

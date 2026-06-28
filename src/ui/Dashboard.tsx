"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api } from "@/src/lib/api";
import { Card, Spinner } from "@/src/ui/primitives";

type AdminStats = {
  totalProducts: number;
  published: number;
  draft: number;
  outOfStock: number;
  totalUsers: number;
  byCategory: { category: string; count: number }[];
};

export function Dashboard() {
  const t = useTranslations("dashboard");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api<{ stats: AdminStats }>("/stats").then((r) => r.stats),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-6 w-6 text-accent" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="rounded-xl border border-danger-bd bg-surface p-8 text-center text-sm text-text-2">
        {t("error")}
      </div>
    );
  }

  const kpis = [
    { id: "totalUsers", label: t("kpiTotalUsers"), value: data.totalUsers },
    { id: "totalProducts", label: t("kpiTotalProducts"), value: data.totalProducts },
    { id: "published", label: t("kpiPublished"), value: data.published },
    { id: "outOfStock", label: t("kpiOutOfStock"), value: data.outOfStock },
  ];
  const maxCat = Math.max(1, ...data.byCategory.map((c) => c.count));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-text">{t("title")}</h1>
      <p className="mb-6 text-sm text-text-2">{t("subtitle")}</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.id} className="p-4">
            <div className="text-xs text-text-2">{k.label}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-text">{k.value}</div>
          </Card>
        ))}
      </div>

      <Card className="mt-4 p-5">
        <h2 className="mb-4 text-sm font-semibold text-text">{t("byCategory")}</h2>
        {data.byCategory.length === 0 ? (
          <p className="text-sm text-text-3">{t("empty")}</p>
        ) : (
          <div className="space-y-3">
            {data.byCategory.map((c) => (
              <div key={c.category} className="flex items-center gap-3">
                <span className="w-28 flex-none truncate text-[13px] capitalize text-text-2">
                  {c.category}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(c.count / maxCat) * 100}%` }}
                  />
                </div>
                <span className="w-8 flex-none text-end text-[13px] font-medium text-text">
                  {c.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

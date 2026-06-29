"use client";

import { useQuery } from "@tanstack/react-query";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { api } from "@/src/lib/api";
import { Card } from "@/src/ui/primitives";
import { DashboardSkeleton, ErrorState } from "@/src/ui/states";

type AdminStats = {
  totalProducts: number;
  published: number;
  draft: number;
  outOfStock: number;
  totalUsers: number;
  newProductsThisMonth: number;
  newUsersThisMonth: number;
  publishedThisMonth: number;
  usersByRole: { admins: number; users: number };
  productsByMonth: { month: string; count: number }[];
  recentActivity: { id: string; name: string; createdAt: string }[];
};

export function Dashboard() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const format = useFormatter();
  const now = useNow(); // stable "now" for relative times (avoids the ENVIRONMENT_FALLBACK warning)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api<{ stats: AdminStats }>("/stats").then((r) => r.stats),
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }
  if (isError || !data) {
    return (
      <div className="mx-auto max-w-5xl">
        <ErrorState
          title={tc("errorTitle")}
          body={t("error")}
          retryLabel={tc("tryAgain")}
          onRetry={() => refetch()}
          statusLabel={tc("statusPage")}
          statusHref="/api/v1/health"
        />
      </div>
    );
  }

  const kpis = [
    { id: "totalUsers", label: t("kpiTotalUsers"), value: data.totalUsers, delta: data.newUsersThisMonth },
    { id: "totalProducts", label: t("kpiTotalProducts"), value: data.totalProducts, delta: data.newProductsThisMonth },
    { id: "published", label: t("kpiPublished"), value: data.published, delta: data.publishedThisMonth },
    { id: "outOfStock", label: t("kpiOutOfStock"), value: data.outOfStock, delta: 0 },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-text">{t("title")}</h1>
      <p className="mb-6 text-sm text-text-2">{t("subtitle")}</p>

      {/* KPI cards with this-month delta pills */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.id} className="p-4">
            <div className="text-xs text-text-2">{k.label}</div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight text-text">
                {format.number(k.value)}
              </span>
              {k.delta > 0 && (
                <span className="rounded-full bg-success-soft px-1.5 py-0.5 text-[10px] font-medium text-success">
                  {t("newThisMonth", { count: k.delta })}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]">
        <ProductsAddedChart data={data.productsByMonth} title={t("productsAdded")} />
        <UsersByRoleDonut
          admins={data.usersByRole.admins}
          users={data.usersByRole.users}
          title={t("usersByRole")}
          adminsLabel={t("roleAdmins")}
          usersLabel={t("roleUsers")}
        />
      </div>

      {/* Recent activity */}
      <Card className="mt-4 p-5">
        <h2 className="mb-4 text-sm font-semibold text-text">{t("recentActivity")}</h2>
        {data.recentActivity.length === 0 ? (
          <p className="text-sm text-text-3">{t("noActivity")}</p>
        ) : (
          <ul className="space-y-3">
            {data.recentActivity.map((a) => (
              <li key={a.id} className="flex items-center gap-3">
                <span className="h-7 w-7 flex-none rounded-full bg-linear-to-br from-accent to-[#60a5fa]" />
                <span className="flex-1 text-sm text-text-2">{t("activityAdded", { name: a.name })}</span>
                <span className="font-mono text-[11px] text-text-3">
                  {format.relativeTime(new Date(a.createdAt), now)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function ProductsAddedChart({ data, title }: { data: { month: string; count: number }[]; title: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-sm font-semibold text-text">{title}</h2>
      <div className="flex h-40 gap-2.5">
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-[5px] bg-gradient-to-t from-accent/15 to-accent"
                style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
                title={`${d.month}: ${d.count}`}
              />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wide text-text-3">{d.month}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function UsersByRoleDonut({
  admins,
  users,
  title,
  adminsLabel,
  usersLabel,
}: {
  admins: number;
  users: number;
  title: string;
  adminsLabel: string;
  usersLabel: string;
}) {
  const total = admins + users;
  const usersPct = total === 0 ? 0 : Math.round((users / total) * 100);
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-sm font-semibold text-text">{title}</h2>
      <div className="flex items-center gap-5">
        <div
          className="relative h-[104px] w-[104px] flex-none rounded-full"
          style={{
            background: `conic-gradient(var(--accent) 0 ${usersPct}%, #22d3ee ${usersPct}% 100%)`,
          }}
        >
          <div className="absolute inset-[20px] flex flex-col items-center justify-center rounded-full bg-surface">
            <span className="text-lg font-semibold text-text">{total}</span>
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="text-text-2">{usersLabel}</span>
            <span className="font-medium text-text">{users}</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#22d3ee]" />
            <span className="text-text-2">{adminsLabel}</span>
            <span className="font-medium text-text">{admins}</span>
          </li>
        </ul>
      </div>
    </Card>
  );
}

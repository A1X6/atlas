import "server-only";
import { prisma } from "@/src/server/db";

export type AdminStats = {
  totalProducts: number;
  published: number;
  draft: number;
  outOfStock: number;
  totalUsers: number;
  byCategory: { category: string; count: number }[];
  // New this month (real deltas, not placeholders).
  newProductsThisMonth: number;
  newUsersThisMonth: number;
  publishedThisMonth: number;
  // Users by role (powers the donut).
  usersByRole: { admins: number; users: number };
  // Products added per month for the last 8 months (oldest → newest).
  productsByMonth: { month: string; count: number }[];
  // Most recent products, used as an activity feed.
  recentActivity: { id: string; name: string; createdAt: string }[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function getAdminStats(): Promise<AdminStats> {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const [
    totalProducts,
    published,
    draft,
    outOfStock,
    totalUsers,
    grouped,
    roleGroups,
    newProductsThisMonth,
    newUsersThisMonth,
    publishedThisMonth,
    monthlyRaw,
    recent,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.product.count({ where: { status: "DRAFT" } }),
    prisma.product.count({ where: { status: "OUT_OF_STOCK" } }),
    prisma.user.count(),
    prisma.product.groupBy({ by: ["category"], _count: { _all: true } }),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.product.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.product.count({ where: { status: "PUBLISHED", createdAt: { gte: startOfMonth } } }),
    prisma.$queryRaw<{ month: Date; count: number }[]>`
      SELECT date_trunc('month', "createdAt") AS month, COUNT(*)::int AS count
      FROM "Product"
      WHERE "createdAt" >= date_trunc('month', now()) - interval '7 months'
      GROUP BY 1
      ORDER BY 1
    `,
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, createdAt: true },
    }),
  ]);

  const byCategory = grouped
    .map((g) => ({ category: g.category, count: g._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const admins = roleGroups.find((r) => r.role === "ADMIN")?._count._all ?? 0;
  const usersByRole = { admins, users: totalUsers - admins };

  // Build a contiguous 8-month window so the chart has no gaps.
  const counts = new Map(
    monthlyRaw.map((r) => [`${r.month.getUTCFullYear()}-${r.month.getUTCMonth()}`, Number(r.count)]),
  );
  const productsByMonth: { month: string; count: number }[] = [];
  const cursor = new Date();
  cursor.setUTCDate(1);
  cursor.setUTCHours(0, 0, 0, 0);
  cursor.setUTCMonth(cursor.getUTCMonth() - 7);
  for (let i = 0; i < 8; i++) {
    const key = `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}`;
    productsByMonth.push({ month: MONTHS[cursor.getUTCMonth()], count: counts.get(key) ?? 0 });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return {
    totalProducts,
    published,
    draft,
    outOfStock,
    totalUsers,
    byCategory,
    newProductsThisMonth,
    newUsersThisMonth,
    publishedThisMonth,
    usersByRole,
    productsByMonth,
    recentActivity: recent.map((p) => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}

import "server-only";
import { prisma } from "@/src/server/db";

export type AdminStats = {
  totalProducts: number;
  published: number;
  draft: number;
  outOfStock: number;
  totalUsers: number;
  byCategory: { category: string; count: number }[];
};

export async function getAdminStats(): Promise<AdminStats> {
  const [totalProducts, published, draft, outOfStock, totalUsers, grouped] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.product.count({ where: { status: "DRAFT" } }),
    prisma.product.count({ where: { status: "OUT_OF_STOCK" } }),
    prisma.user.count(),
    prisma.product.groupBy({ by: ["category"], _count: { _all: true } }),
  ]);

  const byCategory = grouped
    .map((g) => ({ category: g.category, count: g._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return { totalProducts, published, draft, outOfStock, totalUsers, byCategory };
}

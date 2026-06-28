import "server-only";
import type { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "@/src/server/db";

export async function listProducts(args: {
  where: Prisma.ProductWhereInput;
  orderBy: Prisma.ProductOrderByWithRelationInput;
  skip: number;
  take: number;
}) {
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where: args.where,
      orderBy: args.orderBy,
      skip: args.skip,
      take: args.take,
    }),
    prisma.product.count({ where: args.where }),
  ]);
  return { items, total };
}

/**
 * Cursor (keyset) pagination — scales to large catalogues because it never uses
 * a growing OFFSET. Ordered by (createdAt desc, id desc); `id` is the stable,
 * unique tiebreaker that the cursor points at. Fetches one extra row to detect
 * whether another page exists.
 */
export async function listProductsByCursor(args: {
  where: Prisma.ProductWhereInput;
  take: number;
  cursor?: string;
}) {
  const rows = await prisma.product.findMany({
    where: args.where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: args.take + 1,
    ...(args.cursor ? { cursor: { id: args.cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > args.take;
  const items = hasMore ? rows.slice(0, args.take) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}

export function findProductById(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

export function findProductBySlug(slug: string) {
  return prisma.product.findUnique({ where: { slug } });
}

export function findProductByExternalId(externalId: string) {
  return prisma.product.findUnique({ where: { externalId } });
}

export function createProduct(data: Prisma.ProductCreateInput) {
  return prisma.product.create({ data });
}

export function updateProduct(id: string, data: Prisma.ProductUpdateInput) {
  return prisma.product.update({ where: { id }, data });
}

export function deleteProduct(id: string) {
  return prisma.product.delete({ where: { id } });
}

export function bulkUpdateStatus(ids: string[], status: ProductStatus) {
  return prisma.product.updateMany({ where: { id: { in: ids } }, data: { status } });
}

export function bulkDelete(ids: string[]) {
  return prisma.product.deleteMany({ where: { id: { in: ids } } });
}

export async function distinctCategories(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category);
}

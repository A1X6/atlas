import "server-only";
import type { Prisma, Product } from "@prisma/client";
import { NotFoundError } from "@/src/server/http/errors";
import * as repo from "@/src/server/repositories/product-repo";
import type {
  ProductQuery,
  ProductFeedQuery,
  CreateProductInput,
  UpdateProductInput,
  BulkActionInput,
} from "@/src/server/validation/product-schemas";
import { slugify, formatPrice } from "@/src/lib/format";
import type { NormalizedProduct } from "@/src/server/external/dummyjson";

export type ProductDTO = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  price: string;
  currency: string;
  category: string;
  status: Product["status"];
  imageUrl: string | null;
  sku: string | null;
  stock: number;
  createdAt: string;
  updatedAt: string;
};

export function toProductDTO(p: Product): ProductDTO {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    priceCents: p.priceCents,
    price: formatPrice(p.priceCents, p.currency),
    currency: p.currency,
    category: p.category,
    status: p.status,
    imageUrl: p.imageUrl,
    sku: p.sku,
    stock: p.stock,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

function orderByFor(sort: ProductQuery["sort"]): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "price_asc":
      return { priceCents: "asc" };
    case "price_desc":
      return { priceCents: "desc" };
    case "name":
      return { name: "asc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

export type ProductListResult = {
  items: ProductDTO[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/**
 * List products. Public callers only ever see PUBLISHED products; admins
 * (`includeAllStatuses`) see everything and may filter by status. This is the
 * authorization boundary for catalogue visibility — enforced in the service,
 * not the UI.
 */
export async function listProducts(
  query: ProductQuery,
  opts: { includeAllStatuses: boolean },
): Promise<ProductListResult> {
  const where: Prisma.ProductWhereInput = {};

  if (opts.includeAllStatuses) {
    if (query.status) where.status = query.status;
  } else {
    where.status = "PUBLISHED";
  }

  if (query.category) where.category = query.category;

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
      { sku: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const skip = (query.page - 1) * query.pageSize;
  const { items, total } = await repo.listProducts({
    where,
    orderBy: orderByFor(query.sort),
    skip,
    take: query.pageSize,
  });

  return {
    items: items.map(toProductDTO),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export type ProductFeedResult = { items: ProductDTO[]; nextCursor: string | null };

/**
 * Cursor-paginated product feed (newest-first) for infinite scroll. Same
 * authorization boundary as `listProducts`: public callers see PUBLISHED only.
 */
export async function listProductFeed(
  query: ProductFeedQuery,
  opts: { includeAllStatuses: boolean },
): Promise<ProductFeedResult> {
  const where: Prisma.ProductWhereInput = {};
  if (!opts.includeAllStatuses) where.status = "PUBLISHED";
  if (query.category) where.category = query.category;
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
      { sku: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const { items, nextCursor } = await repo.listProductsByCursor({
    where,
    take: query.limit,
    cursor: query.cursor,
  });
  return { items: items.map(toProductDTO), nextCursor };
}

export async function getPublishedProductBySlug(slug: string): Promise<ProductDTO> {
  const product = await repo.findProductBySlug(slug);
  if (!product || product.status !== "PUBLISHED") throw new NotFoundError("Product not found");
  return toProductDTO(product);
}

export async function getProductById(id: string): Promise<ProductDTO> {
  const product = await repo.findProductById(id);
  if (!product) throw new NotFoundError("Product not found");
  return toProductDTO(product);
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "product";
  let candidate = base;
  let n = 1;
  // Collisions are rare; bounded loop keeps it safe.
  while (await repo.findProductBySlug(candidate)) {
    n += 1;
    candidate = `${base}-${n}`;
    if (n > 50) {
      candidate = `${base}-${Date.now().toString(36)}`;
      break;
    }
  }
  return candidate;
}

export async function createProduct(input: CreateProductInput): Promise<ProductDTO> {
  const slug = await uniqueSlug(input.name);
  const product = await repo.createProduct({
    slug,
    name: input.name,
    description: input.description ?? "",
    priceCents: input.priceCents,
    currency: input.currency ?? "USD",
    category: input.category,
    status: input.status ?? "DRAFT",
    stock: input.stock ?? 0,
    imageUrl: input.imageUrl ?? null,
    sku: input.sku ?? null,
  });
  return toProductDTO(product);
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<ProductDTO> {
  const existing = await repo.findProductById(id);
  if (!existing) throw new NotFoundError("Product not found");

  const data: Prisma.ProductUpdateInput = { ...input };
  if (input.name && input.name !== existing.name) {
    data.slug = await uniqueSlug(input.name);
  }
  const product = await repo.updateProduct(id, data);
  return toProductDTO(product);
}

export async function deleteProduct(id: string): Promise<void> {
  const existing = await repo.findProductById(id);
  if (!existing) throw new NotFoundError("Product not found");
  await repo.deleteProduct(id);
}

export async function bulkAction(input: BulkActionInput): Promise<{ affected: number }> {
  if (input.action === "delete") {
    const res = await repo.bulkDelete(input.ids);
    return { affected: res.count };
  }
  const status = input.action === "publish" ? "PUBLISHED" : "DRAFT";
  const res = await repo.bulkUpdateStatus(input.ids, status);
  return { affected: res.count };
}

export function listCategories(): Promise<string[]> {
  return repo.distinctCategories();
}

// ── External sync ─────────────────────────────────────────────────────────────
export type SyncResult = { created: number; updated: number; skipped: number };

/**
 * Upsert normalized external products into our DB by externalId. Our DB is the
 * source of truth the catalogue reads from, so even if a future sync fails the
 * app keeps serving the last-known-good data (graceful degradation).
 */
export async function syncProductsFromExternal(
  products: NormalizedProduct[],
  skipped: number,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;

  for (const p of products) {
    const status = p.stock > 0 ? "PUBLISHED" : "OUT_OF_STOCK";
    const existing = await repo.findProductByExternalId(p.externalId);
    if (existing) {
      await repo.updateProduct(existing.id, {
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        category: p.category,
        stock: p.stock,
        status,
        imageUrl: p.imageUrl,
      });
      updated += 1;
    } else {
      await repo.createProduct({
        slug: await uniqueSlug(p.name),
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        currency: "USD",
        category: p.category,
        status,
        stock: p.stock,
        imageUrl: p.imageUrl,
        externalId: p.externalId,
        sku: `EXT-${p.externalId}`,
      });
      created += 1;
    }
  }

  return { created, updated, skipped };
}

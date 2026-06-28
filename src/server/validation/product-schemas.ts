import { z } from "zod";

export const productStatusSchema = z.enum(["PUBLISHED", "DRAFT", "OUT_OF_STOCK"]);

export const productSortSchema = z
  .enum(["newest", "oldest", "price_asc", "price_desc", "name"])
  .default("newest");

/** Query params for the product list (used by public catalogue + admin table). */
export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  status: productStatusSchema.optional(),
  sort: productSortSchema,
});

/** Query params for the cursor-paginated product feed (newest-first). */
export const productFeedSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(12),
  cursor: z.string().uuid().optional(),
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "name_required").max(140),
  description: z.string().trim().max(2000).optional().default(""),
  priceCents: z.coerce.number().int().min(0, "price_min"),
  currency: z.string().trim().length(3).optional().default("USD"),
  category: z.string().trim().min(1, "category_required").max(80),
  status: productStatusSchema.optional().default("DRAFT"),
  stock: z.coerce.number().int().min(0).optional().default(0),
  imageUrl: z.url().optional(),
  sku: z.string().trim().max(64).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const bulkActionSchema = z.object({
  action: z.enum(["publish", "draft", "delete"]),
  ids: z.array(z.string().uuid()).min(1, "select_min").max(100),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1, "name_required").max(120),
  email: z.email("email_invalid").trim().toLowerCase(),
  message: z.string().trim().min(10, "message_min").max(2000),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;
export type ProductFeedQuery = z.infer<typeof productFeedSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type BulkActionInput = z.infer<typeof bulkActionSchema>;
export type ContactInput = z.infer<typeof contactSchema>;

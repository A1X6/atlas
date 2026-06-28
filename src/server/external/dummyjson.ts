import "server-only";
import { z } from "zod";
import { getEnv } from "@/src/server/env";
import { ExternalServiceError } from "@/src/server/http/errors";
import { resilientFetch } from "./http-client";

/**
 * Client for the external product catalogue (DummyJSON). We treat the response
 * as untrusted: each item is validated independently and invalid items are
 * skipped rather than poisoning our database.
 */

// Only the fields we consume; tolerant of extra keys.
const externalProductSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  description: z.string().default(""),
  price: z.number().nonnegative(), // dollars
  category: z.string().min(1),
  stock: z.number().int().nonnegative().default(0),
  thumbnail: z.string().url().optional(),
});

const externalResponseSchema = z.object({
  products: z.array(z.unknown()),
});

export type NormalizedProduct = {
  externalId: string;
  name: string;
  description: string;
  priceCents: number;
  category: string;
  stock: number;
  imageUrl: string | null;
};

export type FetchResult = {
  products: NormalizedProduct[];
  skipped: number; // invalid items rejected by validation
};

export async function fetchExternalProducts(limit = 30): Promise<FetchResult> {
  const env = getEnv();
  const url = `${env.EXTERNAL_API_BASE_URL}/products?limit=${limit}`;

  const res = await resilientFetch(url, { timeoutMs: env.EXTERNAL_API_TIMEOUT_MS, retries: 2 });

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new ExternalServiceError("Upstream returned invalid JSON");
  }

  const parsed = externalResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new ExternalServiceError("Upstream response had an unexpected shape");
  }

  const normalized: NormalizedProduct[] = [];
  let skipped = 0;

  for (const raw of parsed.data.products) {
    const item = externalProductSchema.safeParse(raw);
    if (!item.success) {
      skipped += 1; // tolerate individual bad records
      continue;
    }
    const p = item.data;
    normalized.push({
      externalId: String(p.id),
      name: p.title,
      description: p.description,
      priceCents: Math.round(p.price * 100),
      category: p.category,
      stock: p.stock,
      imageUrl: p.thumbnail ?? null,
    });
  }

  return { products: normalized, skipped };
}

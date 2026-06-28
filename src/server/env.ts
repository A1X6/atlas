import "server-only";
import { z } from "zod";

/**
 * Centralized, validated environment access.
 * Fail fast at boot if a required secret/config is missing or malformed,
 * rather than discovering it at request time. Secrets are only ever read here
 * and never exposed to the client (this module is server-only).
 */
const EnvSchema = z.object({
  // Database (Neon Postgres connection string)
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Auth — symmetric secrets for signing JWTs (generate with: openssl rand -base64 48)
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be >= 32 chars"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be >= 32 chars"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

  // External API
  EXTERNAL_API_BASE_URL: z.string().url().default("https://dummyjson.com"),
  EXTERNAL_API_TIMEOUT_MS: z.coerce.number().int().positive().default(4000),

  // Upstash Redis (rate limiting). Optional in local dev → limiter no-ops if absent.
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Vercel Blob (image storage). Optional in local dev.
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // App
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
});

let cached: z.infer<typeof EnvSchema> | null = null;

export function getEnv() {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export const isProd = process.env.NODE_ENV === "production";

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
  // Signs the web-only "identity" cookie used for server-side optimistic auth
  // (proxy redirects + SSR'd nav state). Optional: if absent, server-side auth
  // is disabled and the app falls back to client-side bootstrap (no breakage).
  // This cookie NEVER authorizes the API — that stays Bearer-token only.
  JWT_SESSION_SECRET: z.string().min(32, "JWT_SESSION_SECRET must be >= 32 chars").optional(),
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

  // Email (Brevo transactional). Optional → mailer logs to console if absent.
  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().optional(),
  BREVO_SENDER_NAME: z.string().optional(),

  // SMS (Twilio Programmable SMS). Optional → sms-sender logs to console if absent.
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),

  // App
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),

  // Observability (Sentry). NOTE: these are read DIRECTLY from process.env by the
  // Sentry SDK (client/server config) and the build-time withSentryConfig plugin
  // — NOT via getEnv(). Listed here as optional purely so this file is a complete
  // manifest of the project's env; nothing in app code consumes them through here.
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
});

let cached: z.infer<typeof EnvSchema> | null = null;

export function getEnv() {
  if (cached) return cached;
  // Treat empty-string env vars as unset so `.optional()`/`.default()` apply
  // instead of failing validation. A shipped `.env` commonly blanks optional
  // values (e.g. UPSTASH_REDIS_REST_URL="") rather than omitting them.
  const source = Object.fromEntries(
    Object.entries(process.env).map(([k, v]) => [k, v === "" ? undefined : v]),
  );
  const parsed = EnvSchema.safeParse(source);
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

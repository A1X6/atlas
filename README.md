# Atlas — Product & User Management

A full-stack product & user management application built for a technical assessment.

- **Public marketing site** + SEO-indexed **product catalogue** (SSG/SSR/ISR, JSON-LD, hreflang, OG images)
- **Authentication** (register / login) with **role-based access** (Admin / User), **email-verification
  gate**, **account lockout**, and multiple emails/phones per user (each verified via **email**/**SMS OTP**)
- **Admin** dashboard, product management (CRUD, bulk actions, TanStack table), and external-API product sync
- Secure, **mobile-ready REST API** that web and future native apps share; **Sentry** error monitoring
- **Bilingual (English + Arabic) with full RTL**, light/dark theming, and toast notifications

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Prisma 7 + Neon
Postgres · JWT (argon2id) · Vercel Blob · Upstash Redis · TanStack Query + Table · Sentry ·
**next-intl** (i18n) · **next-themes** (theming) · **Sonner** (toasts) · Vitest + Playwright.

> Architecture, security, external API, mobile, and SEO write-ups live in [`/docs`](./docs).

---

## Test accounts (after seeding)

| Role  | Email            | Password    |
| ----- | ---------------- | ----------- |
| Admin | `admin@atlas.io` | `Admin123!` |
| User  | `user@atlas.io`  | `User123!`  |

---

## Run locally

### 1. Prerequisites

- Node.js 20+
- A Postgres database. The easiest is a free [Neon](https://neon.tech) project; any Postgres works.

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env` (see `.env.example` for the full annotated list):

- **Required:** `DATABASE_URL` (Neon/Postgres) and `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
  (generate each with `openssl rand -base64 48`).
- **Optional — graceful fallback if unset:**
  - `UPSTASH_REDIS_REST_URL` / `_TOKEN` — rate limiting (skipped if absent).
  - `BLOB_READ_WRITE_TOKEN` — image uploads (clear error if absent).
  - `BREVO_API_KEY` / `BREVO_SENDER_EMAIL` — real verification/reset **email** (logs to console if absent).
  - `MESSAGECENTRAL_*` — real phone-verification **SMS** (logs to console if absent).
  - `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` — error monitoring (inert if absent).

> With no optional keys set, the app runs fully locally — verification codes/links just print to the
> server console instead of being emailed/texted.

### 3. Install, migrate, seed, run

```bash
npm install
npm run db:deploy     # apply migrations  (or: npm run db:migrate to create/apply in dev)
npm run db:seed       # create test accounts + sample products
npm run dev           # http://localhost:3000
```

Open `http://localhost:3000`, browse the catalogue, then sign in with a test account above.

---

## Scripts

| Script               | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| `npm run dev`        | Start the dev server                                |
| `npm run build`      | Production build (`prisma generate` + `next build`) |
| `npm run db:migrate` | Create & apply a migration (dev)                    |
| `npm run db:deploy`  | Apply existing migrations (prod/CI)                 |
| `npm run db:seed`    | Seed test accounts + sample products                |
| `npm run db:studio`  | Open Prisma Studio                                  |
| `npm test`           | Run unit tests (Vitest)                             |
| `npm run test:integration` | Run DB-backed integration tests (real Neon DB) |
| `npm run test:e2e`   | Run end-to-end tests (Playwright)                   |
| `npm run lint`       | Lint                                                |

---

## Deploy to Vercel

> Full step-by-step go-live checklist (services, env, post-deploy + SEO verification):
> [`docs/PRODUCTION-CHECKLIST.md`](./docs/PRODUCTION-CHECKLIST.md).

1. Push this repo to GitHub and import it in Vercel.
2. Add the **Neon**, **Vercel Blob**, and **Upstash Redis** integrations from the Vercel
   Marketplace — they auto-inject `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, and the Upstash vars.
3. Add `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `APP_URL` (your production URL) as env vars.
   Optionally add `BREVO_*` / `MESSAGECENTRAL_*` (real email/SMS) and `SENTRY_DSN` (monitoring) — without
   them verification codes log to the server logs. `NODE_ENV` is set to `production` by Vercel automatically.
4. Deploy (Vercel auto-deploys on push; its build runs ESLint + TypeScript + `next build` as the gate).
   Then run migrations + seed against the production DB:
   ```bash
   DATABASE_URL=<prod-url> npx prisma migrate deploy
   DATABASE_URL=<prod-url> npm run db:seed
   ```

---

## Project layout

```
app/
  [locale]/               # all pages, locale-prefixed (/en, /ar)
    (public)/             #   marketing pages + public catalogue (SEO)
    (auth)/               #   login, register, password reset, verify (noindex)
    app/                  #   authenticated, role-gated area (noindex)
    layout.tsx            #   <html lang dir> + providers + NextIntlClientProvider + Toaster
  api/v1/                 # versioned REST API (NOT locale-prefixed)
  layout.tsx              # root pass-through; sitemap.ts, robots.ts
proxy.ts                  # next-intl locale middleware (Next 16 renamed middleware→proxy)
messages/                 # en.json, ar.json (all UI strings)
src/
  i18n/                   # routing, navigation (localized Link/useRouter), request config
  server/                 # framework-agnostic backend
    services/ repositories/ auth/ external/ storage/ validation/ http/ security/ email/ sms/
  lib/                    # api client, auth context, utils (cn), useErrorMessage
  components/ui/          # shadcn/ui primitives (button, input, dialog, select, sheet, sonner…)
  ui/                     # Atlas feature components (adapters over shadcn) + LanguageSwitcher
prisma/                   # schema, migrations, seed
test/                     # vitest unit tests + playwright e2e
docs/                     # architecture / security / external-api / mobile / seo / i18n / limitations
```

## Internationalization & theming

- **Languages:** English (`/en`) and Arabic (`/ar`), locale-prefixed for distinct, indexable URLs with
  `hreflang` alternates. Arabic renders **right-to-left** (`<html dir="rtl">`) with an Arabic font (Cairo).
- **Switching:** the globe menu in the header/app sidebar swaps locale while preserving the current path.
- **No hardcoded UI strings** — all copy lives in `messages/{en,ar}.json` via next-intl; dates/numbers
  use locale-aware formatters; API error codes map to translated messages.
- **Theme:** light/dark/system via next-themes (`.dark` class), persisted, no flash.
- **Notifications:** Sonner toasts (RTL-aware) for operation feedback.

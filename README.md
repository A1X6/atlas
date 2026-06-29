# Atlas — Product & User Management

A full-stack product & user management application built for a technical assessment.

- **Public marketing site** (redesigned, bilingual) + SEO-indexed **product catalogue** with JSON-LD,
  `hreflang`, and per-locale OG images
- **Authentication** (register / login) with **role-based access** (Admin / User), an **email-verification
  gate**, **account lockout**, and multiple emails/phones per user (each verified via **email** / **SMS OTP**)
- **Server-side optimistic auth** — the signed-in nav is server-rendered and route redirects run in
  `proxy.ts` from a signed session cookie, so there's no post-load auth flash
- **Admin** dashboard, product management (CRUD, bulk actions, status filter, TanStack table), and
  external-API product sync
- Secure, **mobile-ready REST API** that web and future native apps share; **Sentry** error monitoring
- **Bilingual (English + Arabic) with full RTL**, light/dark theming, and toast notifications

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Prisma 7 + Neon
Postgres · JWT (argon2id) · Vercel Blob · Upstash Redis · TanStack Query + Table · Sentry ·
**next-intl** (i18n) · **next-themes** (theming) · **Sonner** (toasts) · Vitest + Playwright.

---

## Documentation

In-depth write-ups live in [`/docs`](./docs):

| Doc | What's inside |
| --- | --- |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Layered design, request flow, optimistic-auth session, data model, rendering strategy |
| [SECURITY.md](./docs/SECURITY.md) | Threat-by-threat controls, token transport, cookies, conscious tradeoffs |
| [MOBILE.md](./docs/MOBILE.md) | Why the API/core is reusable by native apps with no rewrite |
| [EXTERNAL-API.md](./docs/EXTERNAL-API.md) | DummyJSON sync: timeout / retry / circuit-breaker / Zod validation |
| [I18N.md](./docs/I18N.md) | next-intl routing, messages, formatting, and RTL details |
| [SEO.md](./docs/SEO.md) | Metadata, hreflang, JSON-LD, robots/sitemap, rendering per page type |
| [LIMITATIONS.md](./docs/LIMITATIONS.md) | Honest list of what's out of scope / future work |
| [PRODUCTION-CHECKLIST.md](./docs/PRODUCTION-CHECKLIST.md) | Step-by-step go-live: services, env, deploy, post-deploy + SEO verification |

---

## Test accounts (after seeding)

| Role  | Email            | Password    |
| ----- | ---------------- | ----------- |
| Admin | `admin@atlas.io` | `Admin123!` |
| User  | `user@atlas.io`  | `User123!`  |

---

## Quick start

```bash
cp .env.example .env          # then fill in DATABASE_URL + the two JWT secrets (see below)
npm install
npm run db:deploy             # apply migrations
npm run db:seed               # create test accounts + sample products
npm run dev                   # http://localhost:3000
```

Open `http://localhost:3000`, browse the catalogue, then sign in with a test account above. With no
optional keys set the app runs fully locally — verification codes/links just print to the **server
console** instead of being emailed/texted.

---

## Prerequisites

- **Node.js 20+**
- **A Postgres database.** The easiest is a free [Neon](https://neon.tech) project; any Postgres works.
  Use the **pooled** connection string at runtime.
- (Optional) accounts for Upstash, Vercel Blob, Brevo, Twilio, Sentry — only if you want real rate
  limiting, uploads, email, SMS, or monitoring locally. Everything degrades gracefully without them.

---

## Environment variables

Copy `.env.example` → `.env` and fill it in. Env is **validated at boot** by `src/server/env.ts`
(Zod) — the app fails fast with a clear message if a required value is missing or malformed. Empty
strings are treated as "unset", so optional values can be left blank.

### Required — the app won't start without these

| Variable | Purpose | How to get it |
| --- | --- | --- |
| `DATABASE_URL` | Postgres connection string (pooled) used by Prisma at runtime. | Neon dashboard → connection string (`?sslmode=require`). |
| `JWT_ACCESS_SECRET` | Signs short-lived **access** JWTs. Min 32 chars. | `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | Signs **refresh** JWTs (rotated, hashed in DB). Min 32 chars. | `openssl rand -base64 48` |

### Recommended — graceful fallback if unset

| Variable | Purpose | Fallback when unset |
| --- | --- | --- |
| `JWT_SESSION_SECRET` | Signs the **web-only `atlas_session` cookie** that powers server-side optimistic auth (SSR'd nav + `proxy.ts` redirects). Min 32 chars. **Never authorizes the API** — that stays Bearer-only. | Server-side auth is disabled; the client bootstraps auth itself (brief post-load nav flash). |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL for rate limiting (auth/contact/upload/sync). | Rate limiting **no-ops**. |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token (pairs with the URL). | Rate limiting **no-ops**. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for avatar/product image uploads. | Upload returns a clear error; the rest of the app works. |
| `BREVO_API_KEY` | Brevo transactional-email API key (verification/reset email). | Email **logs to the server console**. |
| `BREVO_SENDER_EMAIL` | Verified Brevo sender address. | — (email logs to console). |
| `BREVO_SENDER_NAME` | Display name on sent email. | Defaults to `Atlas`. |
| `TWILIO_ACCOUNT_SID` | Twilio account SID for phone-verification SMS. | SMS OTP **logs to the server console**. |
| `TWILIO_AUTH_TOKEN` | Twilio auth token. | — (SMS logs to console). |
| `TWILIO_FROM_NUMBER` | Twilio sender number, E.164 (e.g. `+15017122661`). | — (SMS logs to console). |
| `SENTRY_DSN` | Server-side Sentry DSN for error capture. | Sentry SDK stays **inert**. |
| `NEXT_PUBLIC_SENTRY_DSN` | Browser Sentry DSN (exposed to the client). | Sentry SDK stays **inert**. |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Only for **source-map upload** at build time (set in CI). | Source maps aren't uploaded; runtime capture still works. |

### Tunable — sensible defaults, override only if needed

| Variable | Default | Purpose |
| --- | --- | --- |
| `ACCESS_TOKEN_TTL` | `15m` | Access-token lifetime (e.g. `15m`, `1h`). |
| `REFRESH_TOKEN_TTL_DAYS` | `30` | Refresh-token (and session-cookie) lifetime, in days. |
| `EXTERNAL_API_BASE_URL` | `https://dummyjson.com` | Source for the product sync. |
| `EXTERNAL_API_TIMEOUT_MS` | `4000` | Per-request timeout for external calls. |
| `APP_URL` | `http://localhost:3000` | Public base URL — drives SEO **canonical / OG / sitemap**. Must be your real domain in prod (not `localhost`). |
| `NODE_ENV` | `development` | Set automatically by tooling / Vercel — **don't set it manually in prod**. |

> **Note on Sentry vars:** `SENTRY_*` / `NEXT_PUBLIC_SENTRY_DSN` are read **directly** by the Sentry SDK
> and the build-time plugin, not through `getEnv()`. They're listed in `env.ts` only so that file is a
> complete manifest of the project's environment.

---

## Local setup (detailed)

1. **Configure env** — `cp .env.example .env`, then set at minimum `DATABASE_URL`, `JWT_ACCESS_SECRET`,
   and `JWT_REFRESH_SECRET` (generate each secret with `openssl rand -base64 48`). Add
   `JWT_SESSION_SECRET` too for the instant signed-in nav.
2. **Install** — `npm install`.
3. **Migrate** — `npm run db:deploy` (apply existing migrations) or `npm run db:migrate` (create+apply
   in dev).
4. **Seed** — `npm run db:seed` (creates the two test accounts + sample products).
5. **Run** — `npm run dev`, then open `http://localhost:3000`.

> **Windows tip:** if `npm run dev` ever throws a Turbopack panic, delete the `.next` folder and retry,
> or use the production server (`npm run build && npm start`).

---

## Scripts

| Script               | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| `npm run dev`        | Start the dev server                                |
| `npm run build`      | Production build (`prisma generate` + `next build`) |
| `npm start`          | Run the production build                            |
| `npm run db:migrate` | Create & apply a migration (dev)                    |
| `npm run db:deploy`  | Apply existing migrations (prod/CI)                 |
| `npm run db:seed`    | Seed test accounts + sample products                |
| `npm run db:studio`  | Open Prisma Studio                                  |
| `npm test`           | Run unit tests (Vitest)                             |
| `npm run test:integration` | Run DB-backed integration tests (real Neon DB) |
| `npm run test:e2e`   | Run end-to-end tests (Playwright)                   |
| `npm run lint`       | Lint                                                |

Verify everything at once before pushing:

```bash
npm run lint && npx tsc --noEmit && npm test && npm run test:integration && npm run build
```

---

## Deploy to Vercel

> Full step-by-step go-live checklist (services, env, post-deploy + SEO verification):
> [`docs/PRODUCTION-CHECKLIST.md`](./docs/PRODUCTION-CHECKLIST.md).

1. Push this repo to GitHub and import it in Vercel (auto-detects Next.js; Root Directory `./`).
2. Add the **Neon**, **Vercel Blob**, and **Upstash Redis** integrations from the Vercel Marketplace —
   they auto-inject `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, and the Upstash vars.
3. Add `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_SESSION_SECRET`, and `APP_URL` (your production
   URL). Optionally add `BREVO_*` / `TWILIO_*` (real email/SMS) and `SENTRY_DSN` (monitoring) — without
   them verification codes log to the server logs. `NODE_ENV` is set to `production` by Vercel.
4. Deploy. Vercel auto-deploys on push and runs **`vercel-build`**
   (`prisma generate && prisma migrate deploy && next build`), so **migrations apply automatically** on
   every deploy. (`prisma` + `dotenv` are production deps so the CLI works during the build.)
5. Seed the test accounts **once** against the production DB (seeding is deliberately not part of the
   build, so it doesn't re-run on every deploy):
   ```bash
   DATABASE_URL=<prod-url> npm run db:seed
   ```

---

## Project layout

```
app/
  [locale]/               # all pages, locale-prefixed (/en, /ar)
    (public)/             #   marketing pages + public catalogue (indexed)
    (auth)/               #   login, register, password reset, verify (noindex)
    app/                  #   authenticated, role-gated area (noindex)
    layout.tsx            #   <html lang dir> + providers + NextIntlClientProvider + Toaster
                          #   (reads the atlas_session cookie to seed the nav — optimistic auth)
  api/v1/                 # versioned REST API (NOT locale-prefixed)
  layout.tsx              # root pass-through; sitemap.ts, robots.ts
proxy.ts                  # locale (next-intl) + optimistic-auth redirects (Next 16 renamed middleware→proxy)
messages/                 # en.json, ar.json (all UI strings)
src/
  i18n/                   # routing, navigation (localized Link/useRouter), request config
  server/                 # framework-agnostic backend
    services/ repositories/ auth/ external/ storage/ validation/ http/ security/ email/ sms/
  lib/                    # api client, auth context, providers, utils (cn), useErrorMessage
  components/ui/          # shadcn/ui primitives (button, card, accordion, dialog, select, sheet, sonner…)
  ui/                     # Atlas feature components (adapters over shadcn) + LegalPage + LanguageSwitcher
prisma/                   # schema, migrations, seed
test/                     # vitest unit tests + playwright e2e
docs/                     # architecture / security / external-api / mobile / seo / i18n / limitations / production-checklist
```

## Architecture & rendering (at a glance)

- **Layered backend:** thin route handlers → framework-agnostic services → repositories → Prisma. The
  service layer imports nothing from Next, so the same logic powers the web app and a future mobile BFF.
- **Auth:** stateless JWT — an in-memory access token + a rotated, hashed, `httpOnly` refresh cookie.
  A signed, read-only `atlas_session` cookie additionally enables server-rendered nav + redirects
  (optimistic auth); the API itself authenticates **Bearer-only** so mobile reuses it unchanged.
- **Rendering:** all `[locale]/*` routes are **server-rendered (SSR)** because the locale layout reads
  the session cookie; public pages still emit full HTML + metadata/JSON-LD per request and stay fully
  indexable. See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) / [SEO.md](./docs/SEO.md).

## Internationalization & theming

- **Languages:** English (`/en`) and Arabic (`/ar`), locale-prefixed for distinct, indexable URLs with
  `hreflang` alternates. Arabic renders **right-to-left** (`<html dir="rtl">`) with an Arabic font (Cairo).
- **Switching:** the globe menu in the header / app sidebar swaps locale while preserving the current path.
- **No hardcoded UI strings** — all copy lives in `messages/{en,ar}.json` via next-intl; dates/numbers
  use locale-aware formatters; API error codes map to translated messages.
- **Theme:** light/dark/system via next-themes (`.dark` class), persisted, no flash.
- **Notifications:** Sonner toasts (RTL-aware) for operation feedback.

## Testing

- **Unit** (`npm test`) — security-critical pure logic (hashing, tokens, lockout, validation, image
  magic-byte detection, formatting).
- **Integration** (`npm run test:integration`) — real Neon DB; auth flows end-to-end (registration
  gating, email-verification login gate, account lockout, phone OTP).
- **E2E** (`npm run test:e2e`) — Playwright smoke specs over the DB-free public pages.
- No GitHub Actions CI — Vercel's build runs ESLint + TypeScript + `next build` as the gate. Run the
  test suites locally before pushing.

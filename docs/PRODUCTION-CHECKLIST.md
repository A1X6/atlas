# Production Readiness Checklist

The app is **code-complete** — all quality gates pass (ESLint, TypeScript, unit + integration tests,
production build) and every assessment requirement is implemented. This document is the step-by-step
list to take it from "builds locally" to **live and usable by real people**.

> **The only hard blockers** are: (1) set `APP_URL` to your real domain, (2) deploy to Vercel with the
> env vars below, and (3) — if real users must verify their email — configure **Brevo**. Everything else
> is already done or optional.

---

## Phase 0 — Verify locally first

- [ ] Run the gates — all should be green:
  ```bash
  npm run lint && npx tsc --noEmit && npm test && npm run test:integration && npm run build
  ```
- [ ] Smoke test the flows manually (`npm run dev`, or `npm run build && npm start`):
  - [ ] Log in as **admin** (`admin@atlas.io / Admin123!`) → Dashboard, Management, Users, Products all load.
  - [ ] Log in as **user** (`user@atlas.io / User123!`) → only Products; visiting `/en/app/management` is blocked.
  - [ ] Register a new account → "check your email" screen → copy the verify link **from the server terminal** → verify → log in succeeds.
  - [ ] Add a 2nd email + phone on `/app/account` → request codes → read them **from the terminal** → verify.
  - [ ] Product CRUD + bulk + **Sync from API** + search/pagination work; switch to **Arabic** (RTL) renders correctly.
  - [ ] `GET /api/v1/health` → `{"status":"ok","db":"up"}`.

> If `npm run dev` ever throws a Turbopack panic on Windows, delete `.next` and retry, or use the
> production server (`npm run build && npm start`).

---

## Phase 1 — Provision external services

| Service | Needed? | What to do | Env it provides |
| ------- | ------- | ---------- | --------------- |
| **Neon Postgres** | **Required** | Already provisioned (you have `DATABASE_URL`). For a clean prod DB, create a new project/branch. | `DATABASE_URL` |
| **Upstash Redis** | Strongly recommended | Already provisioned (rate limiting). Or add via Vercel Marketplace. | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| **Vercel Blob** | Needed for avatar upload | In the Vercel project → **Storage → Create Blob store**. | `BLOB_READ_WRITE_TOKEN` (auto-injected) |
| **Brevo** (email) | Needed for real user verification | Sign up → **verify a sender email or domain** (required, else sends fail) → *SMTP & API → API Keys* → create a key. | `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` |
| **Twilio** (SMS) | Optional (phone OTP) | Sign up at twilio.com/try-twilio → the Console shows your Account SID + Auth Token; claim a trial phone number (E.164) as the sender. Free trial credit; trial texts deliver to **verified** numbers only. | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` |
| **Sentry** | Optional (monitoring) | Create a project → copy DSN. | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` (+ `SENTRY_ORG/PROJECT/AUTH_TOKEN` for source maps) |

> Without Brevo/Twilio keys the verification flows still work — codes/links just print to the
> server logs instead of being delivered. That's fine for a demo, **not** for real external users.

---

## Phase 2 — Environment variables (set in Vercel → Settings → Environment Variables)

**Required**
- [ ] `DATABASE_URL` — Neon pooled connection string
- [ ] `JWT_ACCESS_SECRET` — **generate a fresh one** for prod: `openssl rand -base64 48`
- [ ] `JWT_REFRESH_SECRET` — **generate a fresh one** for prod: `openssl rand -base64 48`
- [ ] `APP_URL` — your real URL, e.g. `https://atlas.vercel.app` *(drives SEO canonical/OG/sitemap — must not stay `localhost`)*

**Recommended / optional** (graceful fallback if unset)
- [ ] `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — rate limiting
- [ ] `BLOB_READ_WRITE_TOKEN` — avatar uploads (auto-added by the Blob store)
- [ ] `BREVO_API_KEY` / `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME` — real email
- [ ] `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` — real SMS
- [ ] `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` — error monitoring

**Have sensible defaults — only override if needed**
`ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL_DAYS`, `EXTERNAL_API_BASE_URL`, `EXTERNAL_API_TIMEOUT_MS`.

**Do NOT set** `NODE_ENV` — Vercel sets it to `production` automatically. (Once it's `production` over
HTTPS, the `secure` refresh cookie works correctly — the local-http session quirk disappears.)

---

## Phase 3 — Database

The git root is the **`atlas/`** folder, and the migrations live in `prisma/migrations/`.

**Migrations apply automatically on every Vercel deploy** — the `vercel-build` script runs
`prisma generate && prisma migrate deploy && next build` (and `prisma` + `dotenv` are production
dependencies so the CLI survives Vercel's dev-dependency pruning). So you don't run `migrate deploy`
by hand for normal deploys.

- [ ] **Reusing your existing Neon DB?** Already migrated and seeded — nothing to do.
- [ ] **Fresh prod DB?** It will be migrated automatically on first deploy; you only need to **seed the
      test accounts once**:
  ```bash
  DATABASE_URL="<prod-url>" npm run db:seed     # creates admin@atlas.io + user@atlas.io
  ```
  (Seeding is intentionally **not** in `vercel-build` — you don't want to re-seed on every deploy.)

> ⚠️ `migrate deploy` in `vercel-build` runs for **every** deployment, including Preview deploys. If a
> preview points at the same `DATABASE_URL` as production, its migrations hit the production DB. For a
> single-DB assessment that's fine; for a real product, give Preview its own database/branch.

---

## Phase 4 — Deploy to Vercel

- [ ] Push to GitHub (no remote is set yet):
  ```bash
  git remote add origin https://github.com/<you>/<repo>.git
  git push -u origin HEAD
  ```
  `.env` is gitignored — confirm secrets aren't pushed (`git ls-files | grep .env` should show only `.env.example`).
- [ ] Import the repo in Vercel. It auto-detects **Next.js**; Root Directory = `./`. The Neon serverless
      adapter means it runs on Vercel's serverless runtime with no extra config.
- [ ] Add the Phase 2 env vars (Production scope).
- [ ] Deploy. Vercel auto-deploys on every push; its build runs **ESLint + TypeScript + `next build`** as
      the gate (there is no separate GitHub Actions CI — run `npm test && npm run test:integration` locally before pushing).

---

## Phase 5 — Post-deploy smoke test (on the live URL)

- [ ] `GET https://<app>/api/v1/health` → `db: up`
- [ ] Log in as admin and as user; confirm role separation holds.
- [ ] **If Brevo is configured:** register a brand-new email you control → confirm the verification email **actually arrives** → verify → log in.
- [ ] Avatar upload works (requires the Blob token).
- [ ] OG image renders: open `https://<app>/en/opengraph-image` and `/ar/opengraph-image` (both return a PNG).
- [ ] `https://<app>/robots.txt` and `https://<app>/sitemap.xml` return correct absolute URLs (not localhost).

---

## Phase 6 — SEO go-live

- [ ] Add the site to **Google Search Console** and submit `https://<app>/sitemap.xml`.
- [ ] Validate a product page in Google's **Rich Results Test** (Product + BreadcrumbList JSON-LD).
- [ ] Share a link somewhere (or use a card validator) to confirm the **OG image** + title render.

---

## Phase 7 — Security final pass

- [ ] **Use fresh production JWT secrets** — don't reuse dev secrets that have been shared in chats/screens.
- [ ] **Rotate any credential that has been exposed** during development (DB password, Upstash token) for the production environment, or use a separate prod DB/branch.
- [ ] Confirm `.env` is **not** in git (`git check-ignore .env` → `.env`).
- [ ] Confirm the app is served over **HTTPS** (Vercel default) so the `secure` cookies apply.
- [ ] (Optional) Set a real `SENTRY_DSN` so production errors are captured.

---

## Known follow-ups (non-blocking enhancements)

These are documented in [LIMITATIONS.md](./LIMITATIONS.md) and are **not** required for production:

- **Nonce-based CSP** — the prod CSP currently allows `script-src 'unsafe-inline'`; a nonce/hash CSP is stricter.
- **Per-email login throttle** — login rate limiting is IP-based; account lockout already compensates.
- **MFA / passkeys** — natural next step for a higher security bar.
- **Per-locale localized email/SMS templates**, and richer admin auditing — nice-to-haves.

---

## Already done (so you don't redo it)

✅ Auth (argon2id, JWT, rotating+hashed refresh with reuse detection), server-side RBAC, account lockout,
email-verification gate, phone SMS-OTP, rate limiting, input validation, security headers/CSP,
image magic-byte validation · ✅ External API with timeout/retry/circuit-breaker/Zod validation ·
✅ Mobile-ready versioned REST API · ✅ Centralized error handling + Sentry · ✅ SSG/SSR/ISR, metadata,
canonical, hreflang (+ x-default), robots, sitemap, JSON-LD, per-locale OG images, favicon ·
✅ Bilingual EN/AR + RTL · ✅ Unit + integration tests · ✅ Migrations + seed + test accounts ·
✅ Architecture/Security/External-API/Mobile/Limitations/SEO/i18n docs.

See [README.md](../README.md) for run/deploy commands and [ARCHITECTURE.md](./ARCHITECTURE.md) /
[SECURITY.md](./SECURITY.md) for the design rationale.

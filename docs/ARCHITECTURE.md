# Architecture

## Overview

Atlas is a single Next.js 16 application that serves both the web UI and a versioned REST API. It is
organized in **layers** so that business logic is independent of the web framework.

```
HTTP (Route Handlers, /api/v1/*)        ← thin controllers: parse, validate, authorize, respond
        │
Services (src/server/services)          ← business logic, pure TypeScript, no Next imports
        │
Repositories (src/server/repositories)  ← Prisma data access
        │
Database (Neon Postgres)
```

The **service layer imports nothing from Next**, so the same logic can later run inside an
Express/Nest service or a mobile BFF with no rewrite. This is the key decision that satisfies the
"core logic must not be tied to the web" requirement (see [MOBILE.md](./MOBILE.md)).

## Why Next.js only (not Next + a separate Express server)

Mobile readiness is achieved by **code-level layering**, not by deploying a second server. A separate
Express service would add operational overhead the "small app" brief doesn't call for, and its main
benefit (a persistent server) is lost on Vercel's serverless platform — where Next route handlers
already autoscale. Express/Nest would only win for websockets, heavy background jobs, or gRPC, none of
which are required here.

## Request flow (example: create product)

1. `POST /api/v1/products` → `requireRole(req, "ADMIN")` verifies the Bearer access token + role.
2. Body is parsed and validated with a Zod schema (`createProductSchema`).
3. `product-service.createProduct()` generates a unique slug and applies business rules.
4. `product-repo` persists via Prisma.
5. A consistent JSON envelope is returned; any thrown error is mapped to a status code by `http/respond.ts`.

## Data model

Relational, normalized (Prisma schema in `prisma/schema.prisma`):

- `User` 1—N `Email`, 1—N `Phone` (multiple emails/phones, each with an `isPrimary` and a `verified`
  flag). Login identity is resolved through the unique, **verified** primary `Email.address`. The `User`
  also carries `failedLoginAttempts` + `lockedUntil` for **account lockout**.
- `User` 1—N `RefreshToken` (hashed, rotatable, revocable).
- `VerificationToken` — backs **email verification, password reset, and phone (SMS OTP) verification**;
  stores only a token hash, with a type, expiry, and attempt counter.
- `Product` (unique `slug` for SEO URLs, unique `externalId` for sync idempotency, money stored as
  integer `priceCents` to avoid float errors).
- `ContactMessage` for the public contact form.

## Key technology choices

| Area        | Choice                         | Reason                                                            |
| ----------- | ------------------------------ | ---------------------------------------------------------------- |
| DB / ORM    | Neon Postgres + Prisma 7       | Relational domain; versioned migrations; serverless pooling      |
| Auth        | JWT access + rotating refresh  | Stateless; reused by web + mobile; revocable                     |
| Validation  | Zod at every boundary          | Rejects malicious/unexpected input; validates external data      |
| Client data | TanStack Query                 | Caching + loading/error states for the admin + browse UIs        |
| Storage     | Vercel Blob behind an interface| Serverless FS is ephemeral; swappable provider                   |
| Rate limit  | Upstash Redis                  | Shared across serverless instances                               |
| Email       | Brevo (REST) behind `mailer.ts`| Verification/reset email; env-gated, console fallback in dev      |
| SMS         | Twilio Programmable SMS behind `sms-sender.ts` | Phone OTP delivery; env-gated, console fallback in dev |
| Monitoring  | Sentry (`@sentry/nextjs`)      | Error/exception capture; inert until a DSN is set                |
| UI kit      | shadcn/ui (Radix) + Tailwind v4 | Accessible primitives; Atlas tokens mapped onto shadcn variables |
| i18n        | next-intl (locale-prefixed)    | EN/AR + RTL; SEO-friendly per-locale URLs (see I18N.md)          |
| Theming     | next-themes (`.dark` class)    | Light/dark/system, no flash; aligns with shadcn                  |
| Toasts      | Sonner                         | RTL-aware operation feedback                                     |

## Pagination

Two complementary strategies, each chosen for its context:

- **Offset paging** (`?page=&pageSize=`) powers the admin product table and the **public catalogue**,
  where stable, crawlable numbered-page URLs matter for SEO.
- **Cursor (keyset) paging** (`GET /api/v1/products/feed` → `{ items, nextCursor }`) powers the in-app
  product browser's infinite scroll. It never uses a growing `OFFSET`, so it stays fast on large
  tables. Ordered by `(createdAt desc, id desc)` with `id` as the stable cursor.

## Rendering strategy

| Surface             | Rendering            | Indexed |
| ------------------- | -------------------- | ------- |
| Marketing pages     | Static (SSG)         | Yes     |
| Public catalogue    | SSR / ISR + JSON-LD  | Yes     |
| Auth pages          | SSR (light)          | No      |
| Authenticated app   | Dynamic (client)     | No      |

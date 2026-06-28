# Known Limitations & Future Work

Honest list of what's intentionally out of scope or could be improved.

## Functional — implemented since first pass

- **Account editing** ✅ — users edit their profile, avatar, and multiple emails/phones at
  `/app/account` (`PATCH /api/v1/account`); email-verification status is preserved across edits.
- **Admin Users screen** ✅ — admins browse/search users *and* edit role + basic fields at
  `/app/users` (`PATCH /api/v1/users/:id`), with self-lockout and last-admin guards.
- **Email verification & password reset** ✅ — full token-based flows (verify on register, resend,
  forgot/reset). Emails are **logged to the server console** because no mail provider is configured;
  wiring a provider (Resend/SES/Postmark) is a one-function change in `src/server/email/mailer.ts`.
- **Cursor pagination** ✅ — `GET /api/v1/products/feed` is keyset-paginated (newest-first) and powers
  the in-app product browser's infinite scroll. The **public catalogue keeps numbered offset pages on
  purpose** — crawlable numbered URLs are better for SEO than infinite scroll.

## Remaining functional gaps

- **Real email delivery** requires configuring a provider (see above).
- **Cursor feed is newest-first only.** Other sort orders (price, name) still use offset paging;
  keyset pagination for those needs each sort column added to the cursor.
- **Admins can't edit other users' emails/phones** (only role + name + country); users manage their own.

## Internationalization

- **Prices** are formatted locale-aware from `priceCents` via next-intl's formatter (`useFormatter` /
  `getFormatter`) in the catalogue, product detail, and admin table — currency, digits, and separators
  follow the active locale.
- **API error messages are localized server-side** to the request locale (`NEXT_LOCALE` cookie):
  Zod **per-field** messages carry i18n keys (namespace `validation`) and AppErrors localize by code,
  so responses are translated for any consumer (web or mobile) — verified for `/en` and `/ar`.
- Arabic translations were authored for completeness; a native review is recommended before production.

## Security / hardening

- **CSP uses `'unsafe-inline'`** for the inline theme script and injected styles. A nonce-based CSP via
  `proxy.ts` would be stricter.
- **Upload endpoint is usable pre-auth** (to support registration). It is rate-limited and validates
  content, but a fully authenticated, two-step "upload then attach" flow would be tighter.
- **Avatars are stored as public Blob URLs** (unguessable). Private blobs + signed URLs would be
  stricter for sensitive imagery.
- **Rate limiting** no-ops if Upstash isn't configured (local dev). Configure it in any deployed
  environment.

## Testing

- **Unit tests** cover the security-critical pure logic (hashing, tokens, validation, image detection,
  formatting). **Service/repository integration tests** and the **Playwright** data-dependent flows
  (admin CRUD, role 403s) require a seeded database and aren't run in the default CI path; the smoke
  E2E specs cover DB-free public pages.

## Ops

- **Migrations/seed** must be run against the target database after the first deploy (documented in the
  README). There is no automatic seed on deploy.
- **Circuit breaker** state for the external API is in-memory (per serverless instance). A shared store
  would make it global, though per-instance protection is sufficient at this scale.

# Known Limitations & Future Work

Honest list of what's intentionally out of scope or could be improved.

## Functional — implemented since first pass

- **Account editing** ✅ — users edit their profile, avatar, and multiple emails/phones at
  `/app/account` (`PATCH /api/v1/account`); email-verification status is preserved across edits.
- **Admin Users screen** ✅ — admins browse/search users *and* edit role + basic fields at
  `/app/users` (`PATCH /api/v1/users/:id`), with self-lockout and last-admin guards.
- **Email verification & password reset** ✅ — full token-based flows (verify on register, resend,
  forgot/reset), and **login is blocked until the primary email is verified**. Real delivery is wired to
  **Brevo** (`src/server/email/mailer.ts`); without `BREVO_*` keys it **logs to the server console** so
  the flow is fully testable locally.
- **Phone verification (SMS OTP)** ✅ — adding/verifying phone numbers via one-time codes, wired to
  **Message Central** (`src/server/sms/sms-sender.ts`); console fallback when `MESSAGECENTRAL_*` is unset.
- **Account lockout** ✅ — 5 failed logins lock the account for 15 minutes (`src/server/auth/lockout.ts`).
- **Error monitoring** ✅ — Sentry is integrated (`@sentry/nextjs`) and stays inert until a DSN is set.
- **Cursor pagination** ✅ — `GET /api/v1/products/feed` is keyset-paginated (newest-first) and powers
  the in-app product browser's infinite scroll. The **public catalogue keeps numbered offset pages on
  purpose** — crawlable numbered URLs are better for SEO than infinite scroll.

## Remaining functional gaps

- **Real email/SMS delivery** is off until provider keys are set: add `BREVO_*` (email) and
  `MESSAGECENTRAL_*` (SMS). Brevo needs a verified sender; Message Central delivers on free test credits.
  Until then both channels log to the server console.
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

- **Unit tests** (`npm test`) cover the security-critical pure logic (hashing, tokens, lockout,
  validation, image detection, formatting).
- **Integration tests** (`npm run test:integration`) hit a real Neon DB and cover the auth flows
  end-to-end: registration gating, the login email-verification gate, account lockout, and phone OTP.
- **Playwright** smoke specs cover the DB-free public pages.
- There is **no GitHub Actions CI** — the project deploys via **Vercel auto-deploy**, whose build runs
  ESLint + TypeScript + `next build` as the gate. Run the test suites locally before pushing.

## Ops

- **Migrations/seed** must be run against the target database after the first deploy (documented in the
  README). There is no automatic seed on deploy.
- **Circuit breaker** state for the external API is in-memory (per serverless instance). A shared store
  would make it global, though per-instance protection is sufficient at this scale.

# Known Limitations & Future Work

A candid, prioritized list of what is **incomplete, weak, or intentionally out of scope**. Being able
to name these is part of the assessment, so nothing is hidden here.

> For the list of what *is* implemented (auth, verification flows, lockout, product/user management,
> i18n, SEO, monitoring, etc.), see the [README](../README.md) and [ARCHITECTURE](./ARCHITECTURE.md).

---

## Security & hardening

- **No bot protection / CAPTCHA** on public forms (register, login, contact). Abuse is bounded only by
  rate limiting; a Turnstile/reCAPTCHA (or Vercel BotID) challenge would harden signup/login.
- **CSP uses `'unsafe-inline'`** for the inline theme script and injected styles. A nonce-based CSP via
  `proxy.ts` would be stricter.
- **Rate limiting no-ops without Upstash credentials** (so local dev isn't blocked). It **must** be
  configured in any deployed environment, or sensitive endpoints are unprotected.
- **Upload endpoint is usable pre-auth** (to support registration). It is rate-limited, magic-byte
  validated, and capped at 4 MB, but a fully authenticated "upload then attach" flow would be tighter.
- **Uploaded images are public Blob URLs** (with unguessable keys). Private blobs + signed URLs would
  be stricter for sensitive imagery.
- **Modest password policy** — 8–128 chars, must contain a letter and a number. There is no breach-list
  check (e.g. HaveIBeenPwned) and no strength meter.
- **No CSRF tokens.** This is *structurally* mitigated — all state-changing API calls require a **Bearer
  access token** (not a cookie), and the `atlas_session` cookie is `SameSite=Lax` and used only for
  read-only nav/redirects. It would need real CSRF protection if any mutation ever became cookie-authenticated.
- **No audit log** of admin or security-sensitive actions (role changes, deletions, logins). There's no
  trail of who changed what.

## Authentication & sessions

- **No 2FA / MFA at login.** Email and phone verification exist, but neither is a second factor for the
  login step itself.
- **No user-facing session management.** The server *can* revoke all sessions (it does so on password
  change and on refresh-token reuse detection), but there is no "active sessions / log out everywhere"
  screen for users to see or revoke their own devices.

## Data integrity & concurrency

- **No optimistic locking** (no row-version column). Concurrent edits to the same user or product are
  **last-write-wins** — a later save silently overwrites an earlier one with no conflict warning.
- **Circuit-breaker state is in-memory, per serverless instance** — not shared across instances. A
  shared store (Redis) would make the breaker global; per-instance protection is adequate at this scale.

## Privacy & data lifecycle

- **No account deletion and no user deletion by an admin.** There is no "right to erasure" path — a user
  cannot delete their own account, and an admin can only edit users, not remove them. (Products *can* be
  deleted; users cannot.)
- **No account deactivation / suspension.** There is no `disabled`/`suspended` state — an admin can
  change a user's role but cannot lock or disable an account without deleting data.
- **Uploaded images are not re-encoded and EXIF metadata is not stripped.** Files are validated by magic
  bytes and size-capped, but stored as-is, so photos may retain camera/GPS metadata. Re-encoding
  (e.g. with `sharp`) would strip metadata and normalize formats.
- **Admins edit all profile fields *except* emails/phones** — deliberate, since those govern login
  identity + verification, so they stay user-managed. Listed here for completeness, not as a defect.

## Functional gaps

- **Real email/SMS delivery is off until provider keys are set** (`BREVO_*` for email, `TWILIO_*` for
  SMS). Until then both channels **log the code/link to the server console** so flows are testable
  locally. Brevo needs a verified sender; Twilio trial texts only reach verified numbers.
- **Cursor feed is newest-first only.** The in-app infinite scroll (`/api/v1/products/feed`) is keyset
  paginated by recency; other sort orders (price, name) still use offset paging, because keyset paging
  for those needs each sort column folded into the cursor. (The **public catalogue keeps numbered
  offset pages on purpose** — crawlable URLs are better for SEO than infinite scroll.)
- **Search is basic substring matching** (case-insensitive `contains`) — no full-text search, fuzzy
  matching, or relevance ranking.

## Internationalization

- **Only English + Arabic.** Arabic translations were authored for completeness; a **native review is
  recommended** before production. (Prices/dates *are* locale-aware and API error messages *are*
  localized server-side — those are implemented, not gaps.)

## Accessibility

- **Not formally audited** (no axe / Lighthouse a11y pass). One known minor leak: the loading spinner
  has a hardcoded English `aria-label="Loading"` (`src/ui/primitives.tsx`) that doesn't translate.

## Testing & CI

- **Integration tests run against a real Neon database**, not an isolated or transactional test DB, so
  they aren't fully hermetic — they need network access and a reachable DB and can be affected by
  existing data.
- **Playwright covers only the DB-free public pages** — authenticated/admin flows aren't covered by E2E.
- **No GitHub Actions CI.** The quality gate is the **Vercel deploy build** (ESLint + TypeScript +
  `next build`). Run `npm test` / `npm run test:integration` locally before pushing.

## Ops

- **Migrations/seed must be run against the target DB after the first deploy** (documented in the
  README). There is no automatic seed on deploy.

---

## Things that are deliberately *not* limitations

Worth distinguishing from the above, because they look like gaps but are intentional and **implemented**:

- **Refresh-token rotation + reuse detection** — every refresh rotates the token; replaying a consumed
  token revokes the **whole token family** (`rotateRefresh` in `auth-service.ts`).
- **Login email-verification gate** with a from-the-login-screen resend (no account enumeration).
- **Account lockout** after repeated failed logins.
- **Server-side authorization** on every protected route (UI hiding is convenience, not the boundary).
- **Bearer-only API** so the same endpoints serve web and future native clients unchanged.

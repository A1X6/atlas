# Security

Security controls mapped to the risks called out in the assessment.

| Risk area              | Control                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| **Authentication**     | Email + password; passwords hashed with **argon2id** (`@node-rs/argon2`), never stored in plaintext. Login requires a **verified primary email** — unverified accounts are blocked (`EmailNotVerifiedError`). |
| **Passwords**          | Strength policy enforced server-side (Zod). Login uses constant-ish timing (dummy verify on unknown user) to resist enumeration. |
| **Brute force / lockout** | On top of IP rate limiting, **5 failed logins lock the account for 15 minutes** (`auth/lockout.ts`); the counter resets on a successful login. |
| **Sessions**           | Short-lived **JWT access tokens** (15m) + long-lived **refresh tokens** that are **rotated** on each use and stored only as a **SHA-256 hash** (keyed by `jti`) so they can be **revoked**. Reuse of a rotated token revokes the whole family. A **password reset revokes all of the user's refresh tokens**. |
| **Email/phone verification & reset** | Email verification, password reset, and **phone verification (SMS OTP)** all use single-use, high-entropy tokens — only their **SHA-256 hash** is stored, with an expiry (24h verify / 1h reset / 10m OTP), an **attempt cap** on OTP guesses, and an atomic single-consume guard. New emails/phones added to an account start **unverified** and can't be used until verified. **Forgot-password never reveals whether an account exists**. All these endpoints are rate-limited. |
| **Permissions (authz)**| `requireRole()` enforces roles on every protected route **server-side**. The UI also hides actions, but the API is the source of truth — a USER token calling an admin route gets **403**. Admin role changes are guarded against **self-lockout** and removing the **last admin**. |
| **Personal data**      | Responses use **DTOs** (`profileSelect`) that never include the password hash. Data access is centralized in repositories. |
| **Application APIs**   | Every request body/query is validated with **Zod**; a central error handler returns consistent JSON and never leaks stack traces. |
| **Uploaded images**    | Validated by **magic bytes** (not the spoofable Content-Type), size-capped (4 MB), stored under **random, kind-namespaced** keys (`avatars/…`, `products/…`; no path traversal), behind a storage interface. |
| **External API creds** | All external calls (DummyJSON sync, **Brevo** email, **Twilio** SMS, Upstash, Vercel Blob) are **server-side only**; keys are read solely through the `server-only` `env.ts` and never reach the client. Untrusted responses are **Zod-validated** before persistence. |
| **Malicious requests** | **Rate limiting** (Upstash Redis sliding window) on auth, contact, upload, and sync routes; input validation; security headers. |
| **Transport/headers**  | CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and HSTS (see `next.config.ts`). |
| **CSRF**               | State-changing APIs authenticate via **Bearer tokens**, not ambient cookies, so they aren't exposed to CSRF. Cookies carry only the **refresh token** (`httpOnly` + `Secure` + `SameSite=strict`, scoped to `/api/v1/auth`) and a signed, read-only **`atlas_session`** (`httpOnly` + `Secure` + `SameSite=lax`) used solely for server-side redirects/nav — **no mutation trusts a cookie**. |
| **XSS**                | React escapes output; access token kept **in memory** (not `localStorage`); CSP restricts sources. |

## Token transport

- **Access token**: returned in the JSON body; the web client holds it **in memory** (never
  `localStorage`) and sends it as `Authorization: Bearer`. Mobile clients do the same. On a cold load
  the client **mints a token before the first request** and **dedupes concurrent refreshes**
  (single-flight) so parallel calls can't trigger competing refresh-token rotations; a 401 still
  refreshes once and retries as a fallback.
- **Refresh token**: `httpOnly`, `Secure`, `SameSite=strict` cookie scoped to the auth endpoints,
  rotated on every use.
- **`atlas_session`** (web only): a signed (`JWT_SESSION_SECRET`, HS256), `httpOnly`, `SameSite=lax`
  cookie holding only `{ sub, role }`. It lets `proxy.ts` make instant **optimistic** redirect
  decisions and lets the server render the signed-in nav on first paint (no auth flash) **without a DB
  hit**. It grants **no privileges** — every protected route still re-checks the Bearer token. If
  `JWT_SESSION_SECRET` is unset the app falls back to client-side auth; mobile clients ignore it.

## Conscious tradeoffs

- **CSP uses `'unsafe-inline'`** for the tiny inline theme (anti-flash) script and Tailwind's injected
  styles. A nonce-based CSP via a `proxy.ts` is the stricter upgrade.
- **Upload endpoint is usable pre-auth** so it can power the registration form. It is hardened (content
  validation, size cap, random keys, IP rate limiting) and returns only an opaque URL.
- **Uploaded images use public Blob URLs** (avatars under `avatars/`, product images under
  `products/`) with unguessable random suffixes. Switch to `access: "private"` + signed URLs if any
  imagery ever needs stricter control.

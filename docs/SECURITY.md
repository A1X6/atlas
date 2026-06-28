# Security

Security controls mapped to the risks called out in the assessment.

| Risk area              | Control                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| **Authentication**     | Email + password; passwords hashed with **argon2id** (`@node-rs/argon2`), never stored in plaintext.     |
| **Passwords**          | Strength policy enforced server-side (Zod). Login uses constant-ish timing (dummy verify on unknown user) to resist enumeration. |
| **Sessions**           | Short-lived **JWT access tokens** (15m) + long-lived **refresh tokens** that are **rotated** on each use and stored only as a **SHA-256 hash** (keyed by `jti`) so they can be **revoked**. Reuse of a rotated token revokes the whole family. A **password reset revokes all of the user's refresh tokens**. |
| **Email verify / reset** | Single-use tokens are high-entropy random values; only their **SHA-256 hash** is stored, with an expiry (24h verify / 1h reset) and an atomic single-consume guard. **Forgot-password never reveals whether an account exists**. These endpoints are rate-limited. |
| **Permissions (authz)**| `requireRole()` enforces roles on every protected route **server-side**. The UI also hides actions, but the API is the source of truth — a USER token calling an admin route gets **403**. Admin role changes are guarded against **self-lockout** and removing the **last admin**. |
| **Personal data**      | Responses use **DTOs** (`profileSelect`) that never include the password hash. Data access is centralized in repositories. |
| **Application APIs**   | Every request body/query is validated with **Zod**; a central error handler returns consistent JSON and never leaks stack traces. |
| **Uploaded images**    | Validated by **magic bytes** (not the spoofable Content-Type), size-capped (4 MB), stored under **random** keys (no path traversal), behind a storage interface. |
| **External API creds** | All external calls are **server-side only**; base URL/keys come from env and never reach the client. Untrusted responses are **Zod-validated** before persistence. |
| **Malicious requests** | **Rate limiting** (Upstash Redis sliding window) on auth, contact, upload, and sync routes; input validation; security headers. |
| **Transport/headers**  | CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and HSTS (see `next.config.ts`). |
| **CSRF**               | Data APIs authenticate via **Bearer tokens**, not ambient cookies, so they aren't exposed to CSRF. The only cookie (refresh token) is `httpOnly` + `Secure` + `SameSite=strict` and scoped to `/api/v1/auth`. |
| **XSS**                | React escapes output; access token kept **in memory** (not `localStorage`); CSP restricts sources. |

## Token transport

- **Access token**: returned in the JSON body; the web client holds it in memory and sends it as
  `Authorization: Bearer`. Mobile clients do the same. On a 401 the client transparently calls
  `/auth/refresh` once and retries.
- **Refresh token**: `httpOnly`, `Secure`, `SameSite=strict` cookie scoped to the auth endpoints.

## Conscious tradeoffs

- **CSP uses `'unsafe-inline'`** for the tiny inline theme (anti-flash) script and Tailwind's injected
  styles. A nonce-based CSP via a `proxy.ts` is the stricter upgrade.
- **Upload endpoint is usable pre-auth** so it can power the registration form. It is hardened (content
  validation, size cap, random keys, IP rate limiting) and returns only an opaque URL.
- **Avatars use public Blob URLs** with unguessable random suffixes. Switch to `access: "private"` +
  signed URLs if avatars ever need stricter control.

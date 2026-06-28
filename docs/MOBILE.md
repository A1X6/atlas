# Mobile Readiness

The brief requires the backend/API to be reusable by web, Android, and iOS **without rewriting the
core business logic**. The decisions that make this true:

## 1. A versioned REST/JSON API

All functionality is exposed under `/api/v1/*` as plain HTTP + JSON — a protocol every platform speaks
natively. (A TypeScript-only transport like tRPC would couple mobile clients to TS; GraphQL would be
overkill here.) The `v1` prefix lets mobile clients pin a version while the web evolves.

## 2. Stateless, token-based auth

Authentication uses **JWT access + refresh tokens**, not server sessions tied to browser cookies:

- Web and mobile both send `Authorization: Bearer <access token>`.
- The refresh token is delivered in an httpOnly cookie for web; a native app would store it in the
  platform secure store (Keychain / Keystore) and call the same `/api/v1/auth/refresh` endpoint.

Because auth is stateless, the API scales horizontally with no session affinity.

## 3. Framework-agnostic core

Business logic lives in `src/server/services` and `src/server/repositories` and **imports nothing from
Next.js**. The route handlers are thin controllers. The same services can be lifted into an
Express/Nest server or a dedicated mobile BFF with zero changes if the platform ever needs to move off
serverless.

## 4. Consistent contracts

- Uniform response envelopes (`{ data }` / `{ error: { code, message, details } }`) and HTTP status
  codes make client SDKs simple to write on any platform.
- DTOs (not raw DB rows) define a stable shape; money is returned both as `priceCents` (for client-side
  math) and a formatted `price` string.
- Zod schemas are the single definition of request/response shapes and could generate an OpenAPI spec
  for mobile teams.

## What a mobile app would reuse as-is

Registration, login/refresh/logout, profile (`/auth/me`), **email verification & password reset**,
**account management** (multiple emails/phones with **email**/**SMS OTP** verification), product browsing
with pagination/search/sort, admin product management, image upload, and the external sync — all already
HTTP endpoints. A mobile app only needs to build its own UI.

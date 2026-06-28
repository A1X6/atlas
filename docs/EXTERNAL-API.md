# External API Integration

## What it is

The product catalogue can be populated/refreshed from an external source — **DummyJSON**
(`https://dummyjson.com/products`). An admin triggers a sync from the management screen
(**Sync from API**) → `POST /api/v1/products/sync`. It's also used by the seed.

DummyJSON was chosen because it's free, needs no key, and returns realistic product fields that map
cleanly onto our schema — and because syncing a catalogue is genuine business value for a product app
(not a bolt-on).

## How it contributes

Imported items are normalized and **upserted by `externalId`** into our database. Our DB is the single
source of truth the catalogue reads from, so the app keeps working even when the external service is
unavailable (graceful degradation).

## Resilience (the required failure handling)

Implemented in `src/server/external/http-client.ts` and `dummyjson.ts`:

- **Slow** → per-request **timeout** via `AbortController` (`EXTERNAL_API_TIMEOUT_MS`, default 4s).
- **Transient failures / 5xx / 429** → **retry with exponential backoff + jitter** (bounded).
- **Repeatedly down** → a lightweight **circuit breaker** stops calling the host for a cooldown,
  failing fast with a `503` instead of hammering it.
- **Invalid data** → the response shape and **every item** are validated with **Zod**; malformed items
  are **skipped** (counted as `skipped`) rather than corrupting the DB.
- **Request fails entirely** → surfaced as a `503` to the admin; existing catalogue data is untouched,
  and the public catalogue/`ProductBrowser` show a clear "Couldn't load" state.

## Security

- All calls are **server-side only**; the base URL (and any future API key) live in env, never exposed
  to the browser.
- External data is treated as untrusted and validated before it touches the database.

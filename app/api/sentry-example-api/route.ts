export const dynamic = "force-dynamic";

class SentryExampleApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SentryExampleApiError";
  }
}

// Throws on purpose so Sentry's onRequestError hook (instrumentation.ts) captures
// a server-side event. Hit via /sentry-example-page → "Trigger a server-side error".
export function GET() {
  throw new SentryExampleApiError("Atlas Sentry test — server-side error");
}

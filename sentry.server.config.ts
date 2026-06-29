// Sentry server-side init. Inert unless SENTRY_DSN is set, so the app runs
// normally in dev/CI and only reports once a DSN is configured in production.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // Richer debugging context (Sentry-recommended). sendDefaultPii attaches IP +
  // request headers; Sentry still scrubs known-sensitive fields (auth, cookies).
  sendDefaultPii: true,
  includeLocalVariables: true,
  enableLogs: true,
});

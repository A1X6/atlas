// Sentry browser init. Inert unless NEXT_PUBLIC_SENTRY_DSN is set.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  sendDefaultPii: true,
  enableLogs: true,
  // Session Replay (Sentry default masks all text + inputs, so PII stays hidden).
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration()],
});

// Lets Sentry trace client-side navigations in the App Router.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

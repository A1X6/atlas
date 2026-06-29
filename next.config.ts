import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Content Security Policy. 'unsafe-inline' is required for the small inline theme
// script (anti-flash) and Tailwind's injected styles; everything else is locked to
// 'self' plus the image hosts we use. (A nonce-based CSP via proxy is the stricter
// future upgrade — noted in SECURITY.md.)
// React's dev build uses eval() for debugging (Turbopack/HMR); production never
// does. Allow 'unsafe-eval' only in development so the prod CSP stays strict.
const isDev = process.env.NODE_ENV !== "production";
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'";

const csp = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn.dummyjson.com https://i.dummyjson.com https://*.public.blob.vercel-storage.com",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.dummyjson.com" },
      { protocol: "https", hostname: "i.dummyjson.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// Sentry build-time wrapper. Without an auth token/org/project it simply skips
// source-map upload; the SDK itself stays inert until a DSN is provided.
export default withSentryConfig(withNextIntl(nextConfig), {
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Uploads source maps for readable production stack traces (no-op without a token).
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Upload more client bundles so client-side stack traces resolve cleanly.
  widenClientFileUpload: true,
  // Tunnel browser events through our own origin to dodge ad-blockers.
  tunnelRoute: "/monitoring",
});

import createMiddleware from "next-intl/middleware";
import { routing } from "@/src/i18n/routing";

// Next.js 16 renamed `middleware` → `proxy` (nodejs runtime). next-intl's
// middleware is exported as the default `proxy` function. It handles locale
// detection and redirects (e.g. `/` → `/en`).
export default createMiddleware(routing);

export const config = {
  // Run on everything except API routes, the Sentry tunnel, Next internals, and
  // files with an extension.
  matcher: ["/((?!api|monitoring|_next|_vercel|.*\\..*).*)"],
};

import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/src/i18n/routing";
import { SESSION_COOKIE, verifyIdentity, isIdentityConfigured } from "@/src/server/auth/identity";

// Next.js 16 renamed `middleware` → `proxy` (nodejs runtime). This composes two
// concerns: next-intl locale routing AND optimistic auth redirects.
//
// Optimistic auth (Next.js best practice): we only READ the signed identity
// cookie here — no DB lookups, since the proxy runs on every request including
// prefetches. The authoritative check still happens at the data layer (the API
// enforces the Bearer token). When JWT_SESSION_SECRET is unset the auth layer is
// skipped entirely and we behave exactly as before (client-side guards only).
const intlMiddleware = createMiddleware(routing);

const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
const locales = routing.locales as readonly string[];

function splitLocale(pathname: string): { locale: string; rest: string } {
  const segments = pathname.split("/");
  if (locales.includes(segments[1])) {
    return { locale: segments[1], rest: "/" + segments.slice(2).join("/") };
  }
  return { locale: routing.defaultLocale, rest: pathname };
}

export default async function proxy(req: NextRequest) {
  if (isIdentityConfigured()) {
    const { locale, rest } = splitLocale(req.nextUrl.pathname);
    const session = await verifyIdentity(req.cookies.get(SESSION_COOKIE)?.value);

    const isAuthPage = AUTH_PAGES.some((p) => rest === p || rest.startsWith(p + "/"));
    const isProtected = rest === "/app" || rest.startsWith("/app/");

    // Already signed in → keep off the auth pages.
    if (session && isAuthPage) {
      return NextResponse.redirect(new URL(`/${locale}/app`, req.url));
    }
    // Not signed in → bounce protected routes to login (before any HTML renders).
    if (!session && isProtected) {
      return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
    }
  }

  return intlMiddleware(req);
}

export const config = {
  // Run on everything except API routes, the Sentry tunnel, Next internals, and
  // files with an extension.
  matcher: ["/((?!api|monitoring|_next|_vercel|.*\\..*).*)"],
};

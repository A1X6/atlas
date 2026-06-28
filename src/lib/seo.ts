import { routing } from "@/src/i18n/routing";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

/** Absolute URL from a path with a leading slash (e.g. "/en/products"). */
export function absoluteUrl(path = ""): string {
  return `${APP_URL}${path}`;
}

/**
 * Per-locale `canonical` + `hreflang` alternates for a public page, including an
 * `x-default` that points at the default locale (Google's recommended fallback).
 * `path` is the locale-less path with a leading slash, or "" for the home page.
 */
export function buildAlternates(locale: string, path = "") {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = `/${l}${path}`;
  languages["x-default"] = `/${routing.defaultLocale}${path}`;
  return { canonical: `/${locale}${path}`, languages };
}

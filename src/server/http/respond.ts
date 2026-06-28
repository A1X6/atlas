import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ZodError } from "zod";
import * as Sentry from "@sentry/nextjs";
import { AppError } from "./errors";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

/**
 * Consistent JSON envelopes for the whole API:
 *   success → { data: ... }
 *   error   → { error: { code, message, details? } }
 * Plus a `handle()` wrapper that turns thrown domain/Zod errors into the correct
 * status codes. Error messages are localized to the request locale (the
 * `NEXT_LOCALE` cookie set by the i18n middleware): Zod field errors carry i18n
 * keys (namespace `validation`) and AppErrors are localized by `code` — so the
 * API returns translated, per-field messages for any consumer (web or mobile).
 */

const DICTS = { en, ar } as const;
type LocaleKey = keyof typeof DICTS;

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

async function requestLocale(): Promise<LocaleKey> {
  try {
    const value = (await cookies()).get("NEXT_LOCALE")?.value;
    return value === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}

function lookup(locale: LocaleKey, namespace: "validation" | "errors", key: string): string {
  const ns = DICTS[locale][namespace] as Record<string, string>;
  return ns[key] ?? key;
}

export async function fail(error: unknown) {
  const locale = await requestLocale();

  if (error instanceof ZodError) {
    const fieldErrors = error.flatten().fieldErrors as Record<string, string[] | undefined>;
    const details: Record<string, string[]> = {};
    let firstMessage: string | undefined;
    for (const [field, keys] of Object.entries(fieldErrors)) {
      if (!keys?.length) continue;
      details[field] = keys.map((k) => lookup(locale, "validation", k));
      firstMessage ??= details[field][0];
    }
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: firstMessage ?? lookup(locale, "errors", "VALIDATION_ERROR"),
          details,
        },
      },
      { status: 400 },
    );
  }

  if (error instanceof AppError) {
    // Localize by code; fall back to the thrown message if no translation exists.
    const ns = DICTS[locale].errors as Record<string, string>;
    const message = ns[error.code] ?? error.message;
    return NextResponse.json(
      { error: { code: error.code, message, details: error.details } },
      { status: error.statusCode },
    );
  }

  // Unknown/unexpected — never expose internals to the client. Report to Sentry
  // (inert without a DSN) and log for local visibility.
  Sentry.captureException(error);
  console.error("Unhandled API error:", error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: lookup(locale, "errors", "INTERNAL_ERROR") } },
    { status: 500 },
  );
}

/** Wrap a route handler so any thrown error becomes a consistent JSON response. */
export function handle<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response> | Response,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (error) {
      return await fail(error);
    }
  };
}

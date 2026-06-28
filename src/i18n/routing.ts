import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  // 'as-needed' would drop the prefix for the default locale; we use 'always'
  // so both languages get distinct, indexable URLs (/en/…, /ar/…).
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

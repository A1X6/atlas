# SEO

SEO applies to **public** pages only; authenticated and auth pages are explicitly `noindex`.

## Multilingual (EN/AR)

Pages are **locale-prefixed** (`/en/…`, `/ar/…`) so each language has its own indexable URL. Every
public page's `generateMetadata` sets a per-locale `alternates.canonical` plus `alternates.languages`
(`hreflang` for `en` and `ar`), and `sitemap.ts` emits both locale URLs with alternates (via
`getPathname`). `robots.ts` disallows locale-prefixed private paths (`/*/app/`, `/*/login`, …).
See [I18N.md](./I18N.md).

## Rendering per page type

| Pages                                  | Rendering           | Indexed |
| -------------------------------------- | ------------------- | ------- |
| `/`, `/about`, `/contact`, `/privacy`, `/terms` | Static (SSG) | Yes     |
| `/products`                            | SSR (per request)   | Yes     |
| `/products/[slug]`                     | ISR (`revalidate=300`) | Yes  |
| `/login`, `/register`                  | SSR, `noindex`      | No      |
| `/app/*`                               | Dynamic, `noindex`  | No      |

## What's implemented

- **Metadata API**: per-page `generateMetadata` / static `metadata` with titles (templated `%s · Atlas`),
  descriptions, and **canonical URLs**. Open Graph + Twitter card defaults in the root layout.
  `metadataBase` is set at the root layout so OG/canonical URLs resolve absolute.
- **`hreflang` incl. `x-default`**: a shared helper (`src/lib/seo.ts → buildAlternates`) emits
  per-locale `canonical` + `languages` (`en`, `ar`, and `x-default` → default locale) on every public
  page and in `sitemap.ts`.
- **Default social image + favicon**: generated `app/opengraph-image.tsx` (1200×630, `next/og`) used by
  every public page that doesn't set its own, and `app/icon.svg` favicon.
- **Structured data (JSON-LD)**: **Organization** + **WebSite** (with `SearchAction`) on the home page;
  **Product** (name, description, category, SKU, image, price + availability `Offer`) and a
  **BreadcrumbList** on each product detail page.
- **`sitemap.xml`** (`app/sitemap.ts`): static routes + published product URLs (degrades gracefully if
  the DB is unavailable).
- **`robots.txt`** (`app/robots.ts`): allows public pages, disallows `/app/`, `/login`, `/register`,
  `/api/`, and points to the sitemap.
- **Performance/UX signals**: `next/image` for product images (lazy, sized, remote patterns allowlisted),
  semantic HTML headings, system font via `next/font` (no layout shift), and a CSP/security-header set.
- **Privacy of private pages**: auth and `/app/*` set `robots: { index: false }` in their layout
  metadata, so the catalogue is indexed but the admin area never is.

## Verifying

- Lighthouse SEO on `/`, `/products`, `/products/[slug]`.
- `GET /sitemap.xml` and `GET /robots.txt`.
- Google Rich Results test on a product page (Product schema).

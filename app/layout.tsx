import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

// Set metadataBase at the root so social/OG image URLs (incl. the root-level
// opengraph-image and icon) resolve to absolute URLs everywhere.
export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
};

// Root layout is intentionally a pass-through. The real <html>/<body> (with the
// active locale and text direction) is rendered by app/[locale]/layout.tsx — the
// next-intl App Router pattern for locale-prefixed routing.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}

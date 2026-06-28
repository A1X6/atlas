import "./globals.css";
import type { ReactNode } from "react";

// Root layout is intentionally a pass-through. The real <html>/<body> (with the
// active locale and text direction) is rendered by app/[locale]/layout.tsx — the
// next-intl App Router pattern for locale-prefixed routing.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}

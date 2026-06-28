import type { MetadataRoute } from "next";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private/auth areas must never be indexed (locale-prefixed, e.g. /en/app, /ar/login).
      disallow: [
        "/*/app/",
        "/*/login",
        "/*/register",
        "/*/forgot-password",
        "/*/reset-password",
        "/*/verify-email",
        "/api/",
      ],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}

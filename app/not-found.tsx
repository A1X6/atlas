import Link from "next/link";

// Root 404 — only hit for paths outside the locale structure (e.g. an invalid
// locale prefix). The root layout is a pass-through, so this renders its own
// <html>/<body>. Localized 404s are handled by app/[locale]/not-found.tsx.
export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f4f5f7",
          color: "#15171c",
        }}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          <p style={{ fontSize: 48, fontWeight: 700, color: "#2563eb", margin: 0 }}>404</p>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginTop: 8 }}>Page not found</h1>
          <p style={{ marginTop: 8, color: "#576070" }}>
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              marginTop: 20,
              padding: "8px 16px",
              borderRadius: 8,
              background: "#2563eb",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Back to home
          </Link>
        </div>
      </body>
    </html>
  );
}

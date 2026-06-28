"use client";

// Root error boundary. Reports the crash to Sentry (inert without a DSN) and
// shows a minimal fallback. Must render its own <html>/<body> since it replaces
// the root layout when a render error escapes.
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

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
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ marginTop: 8, color: "#576070" }}>
            An unexpected error occurred. Please refresh the page.
          </p>
        </div>
      </body>
    </html>
  );
}

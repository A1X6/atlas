"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

// Sentry verification utility (mirrors the Sentry onboarding "Verify" step).
// Trigger an error, then check your Sentry → Issues. Safe to delete once verified.
export default function SentryExamplePage() {
  const [status, setStatus] = useState<string | null>(null);

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: 40, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Sentry verification</h1>
      <p style={{ color: "#666", marginTop: 8, lineHeight: 1.6 }}>
        Trigger a test error, then open your Sentry project → <b>Issues</b> (it appears within ~30s).
        Requires <code>NEXT_PUBLIC_SENTRY_DSN</code> / <code>SENTRY_DSN</code> to be set.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20, maxWidth: 300 }}>
        <button
          style={btn}
          onClick={() => {
            const id = Sentry.captureException(new Error("Atlas Sentry test — manual capture"));
            setStatus(`Sent to Sentry (event ${id}). Check Issues.`);
          }}
        >
          Send a test error to Sentry
        </button>
        <button
          style={btn}
          onClick={async () => {
            setStatus("Triggering server-side error…");
            await fetch("/api/sentry-example-api").catch(() => {});
            setStatus("Server error triggered. Check Issues.");
          }}
        >
          Trigger a server-side error
        </button>
        <button
          style={btn}
          onClick={() => {
            throw new Error("Atlas Sentry test — uncaught client error");
          }}
        >
          Throw an uncaught client error
        </button>
      </div>
      {status && <p style={{ marginTop: 16, color: "#2563eb" }}>{status}</p>}
    </main>
  );
}

const btn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #d4d4d8",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 500,
};

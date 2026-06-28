import "server-only";
import { ExternalServiceError } from "@/src/server/http/errors";

/**
 * Pluggable email sender. When Brevo is configured (BREVO_API_KEY +
 * BREVO_SENDER_EMAIL) real transactional email is sent via Brevo's REST API;
 * otherwise emails are logged to the server console so the verification / reset
 * flows stay fully testable locally without any provider.
 *
 * Brevo free tier (300 emails/day) can send to ANY recipient — verify a sender
 * address or domain at brevo.com, then create an API key under SMTP & API.
 */
export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

function brevoConfig() {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !senderEmail) return null;
  return { apiKey, senderEmail, senderName: process.env.BREVO_SENDER_NAME || "Atlas" };
}

/** Minimal HTML wrapper for text-only mails (Brevo prefers htmlContent present). */
function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;line-height:1.5">${escaped}</body></html>`;
}

export async function sendEmail(mail: OutgoingEmail): Promise<void> {
  const cfg = brevoConfig();

  // Dev fallback: log so the flow is fully testable without a provider.
  if (!cfg) {
    console.info(
      `\n[email] → ${mail.to}\n  subject: ${mail.subject}\n  ${mail.text.replace(/\n/g, "\n  ")}\n`,
    );
    return;
  }

  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": cfg.apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: cfg.senderEmail, name: cfg.senderName },
      to: [{ email: mail.to }],
      subject: mail.subject,
      htmlContent: mail.html ?? textToHtml(mail.text),
      textContent: mail.text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new ExternalServiceError(`Email send failed (Brevo ${res.status}): ${detail.slice(0, 200)}`);
  }
}

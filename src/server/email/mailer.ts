import "server-only";

/**
 * Pluggable email sender. No mail provider is configured for the assessment, so
 * in development emails are logged to the server console (the verification /
 * reset links are visible there). To send real email, integrate a provider
 * (e.g. Resend, SES, Postmark) inside `sendEmail` — the call sites don't change.
 */
export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail(mail: OutgoingEmail): Promise<void> {
  // Example integration point:
  // if (process.env.RESEND_API_KEY) { await resend.emails.send({...}); return; }

  // Dev fallback: log so the flow is fully testable without a provider.
  console.info(
    `\n[email] → ${mail.to}\n  subject: ${mail.subject}\n  ${mail.text.replace(/\n/g, "\n  ")}\n`,
  );
}

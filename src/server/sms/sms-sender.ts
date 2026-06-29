import "server-only";
import { ExternalServiceError } from "@/src/server/http/errors";

/**
 * Pluggable SMS sender, mirroring the email mailer. When Twilio is configured
 * (TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM_NUMBER) real texts are
 * sent via the Twilio Programmable SMS REST API; otherwise messages are logged
 * to the server console so the phone-verification flow stays fully testable
 * locally without a provider.
 *
 * We keep our own OTP generation (see auth/otp.ts) and use Twilio purely as the
 * transport — the app owns the code lifecycle, Twilio just delivers the text.
 */
export type OutgoingSms = {
  to: string; // recipient in E.164 format, e.g. "+447700900812"
  text: string;
};

function twilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !from) return null;
  return { accountSid, authToken, from };
}

export async function sendSms(sms: OutgoingSms): Promise<void> {
  const cfg = twilioConfig();

  // Dev fallback: log so the flow is fully testable without a provider.
  if (!cfg) {
    console.info(`\n[sms] → ${sms.to}\n  ${sms.text}\n`);
    return;
  }

  // Twilio Programmable SMS: POST form-encoded From/To/Body with HTTP Basic auth
  // (Account SID + Auth Token). A successful send returns 201 with a message SID.
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(cfg.accountSid)}/Messages.json`;
  const auth = Buffer.from(`${cfg.accountSid}:${cfg.authToken}`).toString("base64");
  const body = new URLSearchParams({ From: cfg.from, To: sms.to, Body: sms.text });

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Basic ${auth}`,
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new ExternalServiceError(`SMS send failed (Twilio ${res.status}): ${detail.slice(0, 200)}`);
  }
}

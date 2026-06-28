import "server-only";
import { ExternalServiceError } from "@/src/server/http/errors";

/**
 * Pluggable SMS sender, mirroring the email mailer. When Message Central is
 * configured (CUSTOMER_ID + PASSWORD + SENDER_ID) real texts are sent via their
 * CPaaS REST API; otherwise messages are logged to the server console so the
 * phone-verification flow stays fully testable locally without a provider.
 *
 * Message Central delivers to any number (free test credits, 190+ countries)
 * with no per-recipient verification. We keep our own OTP generation and use
 * their generic SMS endpoint purely as transport.
 */
export type OutgoingSms = {
  to: string; // display / E.164, e.g. "+44 7700 900812" — used by the console fallback
  text: string;
  countryCode?: string; // calling code, e.g. "+44" or "44" — provider needs it split out
  nationalNumber?: string; // national part, e.g. "7700900812"
};

const MC_BASE = "https://cpaas.messagecentral.com";

function mcConfig() {
  const customerId = process.env.MESSAGECENTRAL_CUSTOMER_ID;
  const password = process.env.MESSAGECENTRAL_PASSWORD;
  const senderId = process.env.MESSAGECENTRAL_SENDER_ID;
  if (!customerId || !password || !senderId) return null;
  return {
    customerId,
    password,
    senderId,
    email: process.env.MESSAGECENTRAL_EMAIL || "",
    defaultCountry: (process.env.MESSAGECENTRAL_COUNTRY || "1").replace(/\D/g, "") || "1",
  };
}

type McConfig = NonNullable<ReturnType<typeof mcConfig>>;

// Auth tokens are reusable across sends; cache and refetch on expiry (401).
let cachedToken: string | null = null;

async function getToken(cfg: McConfig, country: string): Promise<string> {
  if (cachedToken) return cachedToken;
  const url = new URL(`${MC_BASE}/auth/v1/authentication/token`);
  url.searchParams.set("customerId", cfg.customerId);
  url.searchParams.set("key", Buffer.from(cfg.password).toString("base64"));
  url.searchParams.set("scope", "NEW");
  url.searchParams.set("country", country);
  if (cfg.email) url.searchParams.set("email", cfg.email);

  const res = await fetch(url, { method: "GET", headers: { accept: "application/json" } });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new ExternalServiceError(`SMS auth failed (Message Central ${res.status}): ${detail.slice(0, 200)}`);
  }
  const data = (await res.json().catch(() => ({}))) as {
    token?: string;
    authToken?: string;
    data?: { token?: string };
  };
  const token = data.token ?? data.authToken ?? data.data?.token;
  if (!token) throw new ExternalServiceError("SMS auth returned no token (Message Central)");
  cachedToken = token;
  return token;
}

async function sendViaMessageCentral(
  cfg: McConfig,
  country: string,
  mobile: string,
  text: string,
): Promise<void> {
  const attempt = async () => {
    const token = await getToken(cfg, country);
    const url = new URL(`${MC_BASE}/verification/v3/send`);
    url.searchParams.set("countryCode", country);
    url.searchParams.set("flowType", "SMS");
    url.searchParams.set("mobileNumber", mobile);
    url.searchParams.set("senderId", cfg.senderId);
    url.searchParams.set("type", "SMS");
    url.searchParams.set("messageType", "TRANSACTION");
    url.searchParams.set("message", text);
    return fetch(url, { method: "POST", headers: { authToken: token, accept: "application/json" } });
  };

  let res = await attempt();
  if (res.status === 401) {
    cachedToken = null; // token expired — refetch once and retry
    res = await attempt();
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new ExternalServiceError(`SMS send failed (Message Central ${res.status}): ${detail.slice(0, 200)}`);
  }
}

export async function sendSms(sms: OutgoingSms): Promise<void> {
  const cfg = mcConfig();

  // Dev fallback: log so the flow is fully testable without a provider.
  if (!cfg) {
    console.info(`\n[sms] → ${sms.to}\n  ${sms.text}\n`);
    return;
  }

  const country = (sms.countryCode ?? "").replace(/\D/g, "") || cfg.defaultCountry;
  const mobile = (sms.nationalNumber ?? sms.to).replace(/\D/g, "");
  await sendViaMessageCentral(cfg, country, mobile, sms.text);
}

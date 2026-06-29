"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link, useRouter } from "@/src/i18n/navigation";
import { useAuth } from "@/src/lib/auth";
import { api, ApiError } from "@/src/lib/api";
import { useErrorMessage } from "@/src/lib/useErrorMessage";
import { Button, Checkbox, Input, Label, Card } from "@/src/ui/primitives";

export function LoginForm() {
  const t = useTranslations("auth");
  const em = useErrorMessage();
  const router = useRouter();
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  // When credentials are valid but the email is unverified, the API returns a
  // 403 EMAIL_NOT_VERIFIED — surfaced as a persistent panel rather than a toast.
  const [unverified, setUnverified] = useState(false);
  // Credentials are kept only after a valid-but-unverified login, so the panel's
  // "resend" button can re-prove ownership to the pre-session resend endpoint.
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);
  const [resending, setResending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setUnverified(false);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    try {
      await login({ email, password });
      router.push("/app");
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ApiError && err.code === "EMAIL_NOT_VERIFIED") {
        setCreds({ email, password });
        setUnverified(true);
        return;
      }
      toast.error(em(err, t("signInError")));
    }
  }

  async function resendVerification() {
    if (!creds) return;
    setResending(true);
    try {
      // `auth: false` — this runs before a session exists; the endpoint
      // re-validates the password instead.
      await api("/auth/resend-verification", { method: "POST", body: creds, auth: false });
      toast.success(t("verificationResent"));
    } catch (err) {
      toast.error(em(err, t("signInError")));
    } finally {
      setResending(false);
    }
  }

  return (
    <Card className="w-full max-w-sm p-8 shadow-lg">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-text">{t("signInTitle")}</h1>
        <p className="mt-1 text-[13.5px] text-text-2">{t("signInSubtitle")}</p>
      </div>

      {unverified && (
        <div className="mb-5 rounded-lg border border-warning-bd bg-warning-soft px-3.5 py-3 text-sm text-warning">
          <p className="font-semibold">{t("emailNotVerifiedTitle")}</p>
          <p className="mt-1 text-[13px] leading-relaxed">{t("emailNotVerifiedBody")}</p>
          <button
            type="button"
            onClick={resendVerification}
            disabled={resending}
            className="mt-2 font-medium underline underline-offset-2 hover:opacity-80 disabled:opacity-60"
          >
            {resending ? t("sendingVerification") : t("resendVerification")}
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("password")}</Label>
            <Link href="/forgot-password" className="mb-1.5 text-xs font-medium text-accent hover:underline">
              {t("forgot")}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              required
              autoComplete="current-password"
              className="pe-14"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-medium text-text-3 hover:text-text-2"
            >
              {showPw ? t("hide") : t("show")}
            </button>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-text-2 select-none">
          <Checkbox
            name="remember"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          {t("rememberMe")}
        </label>
        <Button type="submit" className="w-full" loading={submitting}>
          {t("signIn")}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-text-2">
        {t("noAccount")}{" "}
        <Link href="/register" className="font-medium text-accent hover:underline">
          {t("createOne")}
        </Link>
      </p>
    </Card>
  );
}

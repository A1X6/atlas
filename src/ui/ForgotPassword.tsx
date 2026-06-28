"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { api } from "@/src/lib/api";
import { Button, Input, Label, Card } from "@/src/ui/primitives";

export function ForgotPassword() {
  const t = useTranslations("auth");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const email = String(new FormData(e.currentTarget).get("email"));
    try {
      await api("/auth/forgot-password", { method: "POST", auth: false, body: { email } });
    } catch {
      /* always show the same confirmation (no enumeration) */
    } finally {
      setDone(true);
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-sm p-8 shadow-lg">
      <h1 className="text-xl font-semibold text-text">{t("forgotTitle")}</h1>
      {done ? (
        <p className="mt-3 text-sm text-text-2">{t("forgotDoneBody")}</p>
      ) : (
        <>
          <p className="mt-1 text-[13.5px] text-text-2">{t("forgotSubtitle")}</p>
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <Button type="submit" className="w-full" loading={submitting}>
              {t("sendResetLink")}
            </Button>
          </form>
        </>
      )}
      <p className="mt-5 text-center text-sm text-text-2">
        <Link href="/login" className="font-medium text-accent hover:underline">
          {t("backToSignIn")}
        </Link>
      </p>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/src/i18n/navigation";
import { api } from "@/src/lib/api";
import { useErrorMessage } from "@/src/lib/useErrorMessage";
import { Button, Input, Label, Card } from "@/src/ui/primitives";

export function ResetPassword() {
  const t = useTranslations("auth");
  const em = useErrorMessage();
  const token = useSearchParams().get("token");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    const confirm = String(form.get("confirm"));
    if (password !== confirm) {
      toast.error(t("pwMismatch"));
      return;
    }
    if (!token) {
      toast.error(t("missingResetLink"));
      return;
    }
    setSubmitting(true);
    try {
      const { success } = await api<{ success: boolean }>("/auth/reset-password", {
        method: "POST",
        auth: false,
        body: { token, password },
      });
      if (!success) {
        toast.error(t("resetLinkInvalid"));
        setSubmitting(false);
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setSubmitting(false);
      toast.error(em(err, t("resetError")));
    }
  }

  return (
    <Card className="w-full max-w-sm p-8 shadow-lg">
      <h1 className="text-xl font-semibold text-text">{t("resetTitle")}</h1>
      {done ? (
        <p className="mt-3 text-sm text-success">{t("resetDone")}</p>
      ) : (
        <>
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <Label htmlFor="password">{t("newPassword")}</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div>
              <Label htmlFor="confirm">{t("confirmPassword")}</Label>
              <Input id="confirm" name="confirm" type="password" required />
            </div>
            <Button type="submit" className="w-full" loading={submitting}>
              {t("updatePassword")}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-text-2">
            <Link href="/login" className="font-medium text-accent hover:underline">
              {t("backToSignIn")}
            </Link>
          </p>
        </>
      )}
    </Card>
  );
}

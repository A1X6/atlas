"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/src/lib/api";
import { useErrorMessage } from "@/src/lib/useErrorMessage";
import { Button, Input, Textarea, Label, FieldError } from "@/src/ui/primitives";

export function ContactForm() {
  const t = useTranslations("contact");
  const em = useErrorMessage();
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    try {
      await api("/contact", {
        method: "POST",
        auth: false,
        body: {
          name: form.get("name"),
          email: form.get("email"),
          message: form.get("message"),
        },
      });
      formEl.reset();
      setStatus("idle");
      toast.success(t("successToast"));
    } catch (err) {
      setStatus("idle");
      toast.error(em(err, t("errorToast")));
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">{t("nameLabel")}</Label>
        <Input id="name" name="name" required maxLength={120} placeholder={t("namePlaceholder")} />
      </div>
      <div>
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input id="email" name="email" type="email" required placeholder={t("emailPlaceholder")} />
      </div>
      <div>
        <Label htmlFor="message">{t("messageLabel")}</Label>
        <Textarea
          id="message"
          name="message"
          required
          minLength={10}
          maxLength={2000}
          className="h-32"
          placeholder={t("messagePlaceholder")}
        />
        <FieldError>{undefined}</FieldError>
      </div>
      <Button type="submit" loading={status === "submitting"}>
        {t("submit")}
      </Button>
    </form>
  );
}

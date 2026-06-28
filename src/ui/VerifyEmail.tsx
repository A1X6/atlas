"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/src/i18n/navigation";
import { api } from "@/src/lib/api";
import { Card, Spinner } from "@/src/ui/primitives";

export function VerifyEmail() {
  const t = useTranslations("auth");
  const token = useSearchParams().get("token");
  const [state, setState] = useState<"verifying" | "success" | "error">(
    token ? "verifying" : "error",
  );
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    (async () => {
      try {
        const { verified } = await api<{ verified: boolean }>("/auth/verify-email", {
          method: "POST",
          auth: false,
          body: { token },
        });
        setState(verified ? "success" : "error");
      } catch {
        setState("error");
      }
    })();
  }, [token]);

  return (
    <Card className="w-full max-w-sm p-8 text-center shadow-lg">
      {state === "verifying" && (
        <>
          <Spinner className="mx-auto h-6 w-6 text-accent" />
          <p className="mt-4 text-sm text-text-2">{t("verifying")}</p>
        </>
      )}
      {state === "success" && (
        <>
          <h1 className="text-xl font-semibold text-text">{t("verifiedTitle")}</h1>
          <p className="mt-2 text-sm text-text-2">{t("verifiedBody")}</p>
          <Link href="/login" className="mt-5 inline-block font-medium text-accent hover:underline">
            {t("continueToSignIn")}
          </Link>
        </>
      )}
      {state === "error" && (
        <>
          <h1 className="text-xl font-semibold text-text">{t("failedTitle")}</h1>
          <p className="mt-2 text-sm text-text-2">{t("failedBody")}</p>
          <Link href="/login" className="mt-5 inline-block font-medium text-accent hover:underline">
            {t("backToSignIn")}
          </Link>
        </>
      )}
    </Card>
  );
}

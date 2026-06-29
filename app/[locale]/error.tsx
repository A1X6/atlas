"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { useTranslations } from "next-intl";
import { ErrorState } from "@/src/ui/states";

// Route-segment error boundary for everything under a locale. Reports to Sentry
// and offers a retry. (Errors in the root layout itself are caught by
// app/global-error.tsx instead.)
export default function RouteError({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}) {
  const t = useTranslations("common");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const retry = unstable_retry ?? reset;

  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md">
        <ErrorState
          title={t("errorTitle")}
          body={t("errorBody")}
          code={error.digest}
          retryLabel={t("tryAgain")}
          onRetry={retry ? () => retry() : undefined}
          statusLabel={t("statusPage")}
          statusHref="/api/v1/health"
        />
      </div>
    </div>
  );
}

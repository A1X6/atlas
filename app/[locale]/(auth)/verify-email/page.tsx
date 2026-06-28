import { Suspense } from "react";
import type { Metadata } from "next";
import { VerifyEmail } from "@/src/ui/VerifyEmail";
import { Spinner } from "@/src/ui/primitives";

export const metadata: Metadata = {
  title: "Verify email",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<Spinner className="h-6 w-6 text-accent" />}>
      <VerifyEmail />
    </Suspense>
  );
}

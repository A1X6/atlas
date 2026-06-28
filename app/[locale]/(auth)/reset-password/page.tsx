import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPassword } from "@/src/ui/ResetPassword";
import { Spinner } from "@/src/ui/primitives";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Spinner className="h-6 w-6 text-accent" />}>
      <ResetPassword />
    </Suspense>
  );
}

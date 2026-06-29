"use client";

import { useEffect } from "react";
import { useRouter } from "@/src/i18n/navigation";
import { useAuth } from "@/src/lib/auth";
import { Spinner } from "@/src/ui/primitives";

// Keeps already-authenticated users off the auth pages (login / register /
// forgot / reset / verify). Anonymous and still-loading visitors see the page;
// an authenticated visitor is bounced to the app.
export function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/app");
  }, [status, router]);

  if (status === "authenticated") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="h-6 w-6 text-accent" />
      </div>
    );
  }
  return <>{children}</>;
}

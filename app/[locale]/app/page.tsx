"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/lib/auth";
import { Spinner } from "@/src/ui/primitives";

// /app entry → route by role (admins land on the dashboard, users on products).
export default function AppIndex() {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(user.role === "ADMIN" ? "/app/dashboard" : "/app/products");
    } else if (status === "anonymous") {
      router.replace("/login");
    }
  }, [status, user, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <Spinner className="h-6 w-6 text-accent" />
    </div>
  );
}

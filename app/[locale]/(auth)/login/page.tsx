import type { Metadata } from "next";
import { LoginForm } from "@/src/ui/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginForm />;
}

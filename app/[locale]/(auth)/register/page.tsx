import type { Metadata } from "next";
import { RegisterForm } from "@/src/ui/RegisterForm";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return <RegisterForm />;
}

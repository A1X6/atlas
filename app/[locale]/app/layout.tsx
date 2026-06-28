import type { Metadata } from "next";
import { AppShell } from "@/src/ui/AppShell";

// The authenticated app is private — never indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

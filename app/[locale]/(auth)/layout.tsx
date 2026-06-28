import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/src/ui/Logo";
import { ThemeToggle } from "@/src/ui/ThemeToggle";

// Auth pages are public but should not be indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex items-center justify-between px-5 py-4">
        <Logo />
        <ThemeToggle />
      </header>
      <main
        className="flex flex-1 items-center justify-center px-5 py-10"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, var(--accent-soft) 0%, transparent 55%)",
        }}
      >
        {children}
      </main>
      <footer className="px-5 py-4 text-center text-xs text-text-3">
        <Link href="/" className="hover:text-text-2">
          ← Back to Atlas
        </Link>
      </footer>
    </div>
  );
}

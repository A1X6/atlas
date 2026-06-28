import { SiteHeader } from "@/src/ui/SiteHeader";
import { SiteFooter } from "@/src/ui/SiteFooter";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}

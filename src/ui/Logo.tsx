import { Link } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/cn";

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-accent shadow-sm">
        <span className="h-[11px] w-[11px] rounded-[3px] border-2 border-on-accent" />
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-text">Atlas</span>
    </Link>
  );
}

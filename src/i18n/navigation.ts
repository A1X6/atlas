import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware wrappers around Next.js navigation APIs. Use these everywhere
// instead of `next/link` / `next/navigation` so the active locale prefix is
// applied automatically.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

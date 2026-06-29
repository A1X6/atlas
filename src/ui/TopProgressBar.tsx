"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Global navigation progress bar.
 *
 * Next.js client-side transitions fetch the destination route's RSC payload
 * over the network before swapping the page in. During that wait there is no
 * built-in global feedback (route-level `loading.tsx` only shows if the page
 * suspends long enough). This bar gives immediate "navigating…" feedback for
 * every internal link click and completes when the route actually changes.
 *
 * The CSS debounces ~150ms so genuinely instant navigations never flash it.
 */
export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  // Start the bar on same-origin link clicks that actually change the URL.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Same URL → no navigation happens.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setState("loading");
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Route (path or query) changed → the navigation finished. Defer to the next
  // frame so we don't setState synchronously inside the effect (which would
  // trigger a cascading render).
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      setState((s) => (s === "loading" ? "done" : s)),
    );
    return () => cancelAnimationFrame(raf);
    // pathname/searchParams are the completion signal.
  }, [pathname, searchParams]);

  // Reset shortly after the completion animation runs.
  useEffect(() => {
    if (state !== "done") return;
    const id = window.setTimeout(() => setState("idle"), 400);
    return () => window.clearTimeout(id);
  }, [state]);

  return <div aria-hidden className="nav-progress" data-state={state} />;
}

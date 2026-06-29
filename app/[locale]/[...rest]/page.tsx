import { notFound } from "next/navigation";

// Any unknown route under a locale (e.g. /en/does-not-exist) routes to the
// localized not-found page rather than the bare root 404.
export default function CatchAll() {
  notFound();
}

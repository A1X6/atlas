import { Spinner } from "@/src/ui/primitives";

// Shown during navigation while any locale route segment is loading.
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center">
      <Spinner className="h-7 w-7 text-accent" />
    </div>
  );
}

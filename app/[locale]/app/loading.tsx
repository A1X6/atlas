import { DashboardSkeleton } from "@/src/ui/states";

// Shown in the dashboard content area while an app page loads (renders inside
// AppShell, so the sidebar/header stay put). Uses the shimmer skeletons from
// the design spec (§4.6 Loading) rather than a bare spinner.
export default function AppLoading() {
  return <DashboardSkeleton />;
}

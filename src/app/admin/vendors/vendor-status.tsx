import { StatusBadge, type StatusBadgeConfig } from "@merqo/ui";
import type { VendorStatus } from "@/lib/vendor-health";

/**
 * Label/color per vendor triage status, reusing paykit's own brand tokens
 * (mint, primary, flow — all theme-aware) instead of raw Tailwind color
 * literals, matching the family's shared `StatusBadge` dot+pill convention.
 */
const STATUS: Record<VendorStatus, StatusBadgeConfig> = {
  attention: {
    label: "Needs attention",
    className: "bg-destructive/12 text-destructive",
  },
  stuck: {
    label: "Stuck",
    className: "bg-primary/12 text-primary",
  },
  quiet: {
    label: "Quiet",
    className: "bg-muted text-muted-foreground",
  },
  new: {
    label: "New",
    className: "bg-flow/12 text-flow",
  },
  healthy: {
    label: "Healthy",
    className: "bg-mint/15 text-mint",
  },
};

export function VendorStatusBadge({ status }: { status: VendorStatus }) {
  return <StatusBadge status={status} config={STATUS} />;
}

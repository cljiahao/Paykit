import type { VendorPlan } from "@/lib/types";

/** Free tier: 100 tx/mo per vendor, counted across every kit. */
export function freeTierExceeded(
  plan: VendorPlan,
  countThisMonth: number,
): boolean {
  return plan === "free" && countThisMonth >= 100;
}

/** Usage-meter bar fill, 0-100, clamped. */
export function usagePercent(count: number, cap = 100): number {
  return Math.min(100, Math.max(0, Math.round((count / cap) * 100)));
}

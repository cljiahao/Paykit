import type { VendorPlan } from "@/lib/types";
import { shouldNudgePro } from "@/lib/usage";
import { formatCents } from "@/lib/utils";

export interface PlanView {
  plan: VendorPlan;
  planLabel: "Free" | "Pro";
  countLabel: string;
  showNudge: boolean;
  features: string[];
  showUpgrade: boolean;
  /** Live Pro price, formatted for display (e.g. "$4.99/mo"). */
  proPriceLabel: string;
}

/**
 * Pure view-model for the Plan page (and the dashboard nudge): the
 * free/pro feature list, the transaction-count copy, the Pro-nudge
 * visibility, whether to show the upgrade CTA, and the live Pro price
 * formatted for display. `monthlyCents` comes from the admin-tunable
 * `pricing` table (src/lib/pricing.ts), not a hardcoded constant. Revenue
 * stats are free for every vendor — refund tracking is Pro's one
 * remaining gate.
 */
export function resolvePlanView(
  plan: VendorPlan,
  countThisMonth: number,
  monthlyCents: number,
): PlanView {
  const isPro = plan === "pro";
  return {
    plan,
    planLabel: isPro ? "Pro" : "Free",
    countLabel: `${countThisMonth} transaction${countThisMonth === 1 ? "" : "s"} this month`,
    showNudge: shouldNudgePro(plan, countThisMonth),
    features: isPro
      ? ["Unlimited transactions", "Revenue stats", "Refund tracking"]
      : ["Unlimited transactions", "Revenue stats"],
    showUpgrade: !isPro,
    proPriceLabel: `${formatCents(monthlyCents)}/mo`,
  };
}

import type { VendorPlan } from "@/lib/types";
import { shouldNudgePro } from "@/lib/usage";

/** Flat monthly price shown everywhere the Pro upsell is described. */
export const PRO_PRICE = "$12/mo";

export interface PlanView {
  plan: VendorPlan;
  planLabel: "Free" | "Pro";
  countLabel: string;
  showNudge: boolean;
  features: string[];
  showUpgrade: boolean;
}

/**
 * Pure view-model for the Plan page: the free/pro feature list, the
 * transaction-count copy (singular/plural), the Pro-nudge visibility
 * (`shouldNudgePro`), and whether to show the upgrade CTA. Kept out of
 * `plan/page.tsx`'s JSX so this branching logic is unit-testable without
 * rendering the async server component.
 */
export function resolvePlanView(
  plan: VendorPlan,
  countThisMonth: number,
): PlanView {
  const isPro = plan === "pro";
  return {
    plan,
    planLabel: isPro ? "Pro" : "Free",
    countLabel: `${countThisMonth} transaction${countThisMonth === 1 ? "" : "s"} this month`,
    showNudge: shouldNudgePro(plan, countThisMonth),
    features: isPro
      ? ["Unlimited transactions", "Stats", "Refunds"]
      : ["Unlimited transactions"],
    showUpgrade: !isPro,
  };
}

import type { createServerClient } from "@/lib/supabase/server";

export interface PricingConfig {
  monthly_cents: number;
  currency: string;
}

/**
 * Fallback when the `pricing` row can't be read (e.g. pre-migration).
 * Zeroed so every consuming page still renders instead of throwing —
 * mirrors qkit's own DEFAULT_PRICING fallback.
 */
export const DEFAULT_PRICING: PricingConfig = {
  monthly_cents: 0,
  currency: "SGD",
};

/**
 * Reads the single pricing row (id = 1). Accepts either the cookie client
 * (dashboard/landing reads — the row is public-read, pricing_public_select)
 * or the service-role client (the admin read, via admin-data.ts) — both
 * are structurally the same generated client type, just different auth.
 */
export async function getPricing(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
): Promise<PricingConfig> {
  const { data } = await supabase
    .from("pricing")
    .select("monthly_cents, currency")
    .eq("id", 1)
    .maybeSingle();
  return data ?? DEFAULT_PRICING;
}

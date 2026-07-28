import type { VendorPlan } from "@/lib/types";

export type VendorStatus =
  { active: true; plan: VendorPlan } | { active: false; plan: null };

/**
 * paykit.vendor_payment_config has no email column (vendor_id references
 * auth.users(id) directly), so the caller supplies the auth-user list
 * (from supabase.auth.admin.listUsers) alongside the config rows, and this
 * pure function does the two-step lookup — mirrors qkit's
 * merqo-vendor-status.ts resolveVendorStatus exactly.
 */
export function resolveVendorStatus(
  email: string,
  authUsers: { id: string; email: string | null }[],
  configs: { vendor_id: string; plan: VendorPlan }[],
): VendorStatus {
  const key = email.toLowerCase();
  const user = authUsers.find((u) => u.email?.toLowerCase() === key);
  if (!user) return { active: false, plan: null };
  const config = configs.find((c) => c.vendor_id === user.id);
  if (!config) return { active: false, plan: null };
  return { active: true, plan: config.plan };
}

import { createServiceClient } from "@/lib/supabase/server";
import { listAllUsers } from "@/lib/list-all-users";
import type { PaymentConfigKind, TxStatus, VendorPlan } from "@/lib/types";

type ServiceClient = Awaited<ReturnType<typeof createServiceClient>>;

export type PlatformTotals = {
  vendors: number;
  free_vendors: number;
  pro_vendors: number;
  transactions: number;
  confirmed_transactions: number;
  confirmed_volume_cents: number;
};

export type ActivityRow = {
  id: string;
  vendor_id: string;
  email: string | null;
  kit_slug: string;
  amount_cents: number;
  status: TxStatus;
  created_at: string;
};

export type VendorRow = {
  vendor_id: string;
  email: string | null;
  plan: VendorPlan;
  kind: PaymentConfigKind;
  payee_name: string | null;
  label: string | null;
  transaction_count: number;
  created_at: string;
};

// The admin console spans every vendor, so it reads with the service-role
// client (RLS-exempt) rather than widening the per-vendor policies. Vendor
// identity lives on auth.users, resolved to email via the admin API — the
// primary "who is this vendor" identity, since payee_name is null for
// `kind='pointer'` rows (see the vendor_payment_config_kind_shape check in
// 0003_paykit_multi_method.sql) and can't stand in for every vendor alone.
async function emailByUserId(
  supabase: ServiceClient,
): Promise<Map<string, string | null>> {
  const { data } = await listAllUsers(supabase);
  return new Map((data?.users ?? []).map((u) => [u.id, u.email ?? null]));
}

/** Platform-wide totals for the overview stat tiles. */
export async function platformTotals(): Promise<PlatformTotals> {
  const supabase = await createServiceClient();
  const [vendorsRes, txRes] = await Promise.all([
    supabase.from("vendor_payment_config").select("vendor_id, plan"),
    supabase.from("transactions").select("id, status, amount_cents"),
  ]);
  for (const r of [vendorsRes, txRes]) {
    if (r.error) throw new Error(`platformTotals: ${r.error.message}`);
  }
  const vendors = vendorsRes.data ?? [];
  const transactions = txRes.data ?? [];
  const confirmed = transactions.filter((t) => t.status === "confirmed");

  return {
    vendors: vendors.length,
    free_vendors: vendors.filter((v) => v.plan === "free").length,
    pro_vendors: vendors.filter((v) => v.plan === "pro").length,
    transactions: transactions.length,
    confirmed_transactions: confirmed.length,
    confirmed_volume_cents: confirmed.reduce(
      (sum, t) => sum + t.amount_cents,
      0,
    ),
  };
}

/** The most recent transactions across every vendor, identity resolved to email. */
export async function recentActivity(limit = 15): Promise<ActivityRow[]> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("id, vendor_id, kit_slug, amount_cents, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`recentActivity: ${error.message}`);

  const emails = await emailByUserId(supabase);
  return (data ?? []).map((tx) => ({
    id: tx.id,
    vendor_id: tx.vendor_id,
    email: emails.get(tx.vendor_id) ?? null,
    kit_slug: tx.kit_slug,
    amount_cents: tx.amount_cents,
    status: tx.status,
    created_at: tx.created_at,
  }));
}

/**
 * Every vendor with a payment config, their transaction count, and resolved
 * email — for the admin Vendors table. Aggregation is done in TS over two
 * flat reads (vendor_payment_config, transactions) to avoid multi-join SQL,
 * matching admin-data's pattern in the sibling kits.
 */
export async function listVendors(): Promise<VendorRow[]> {
  const supabase = await createServiceClient();
  const [vendorsRes, txRes] = await Promise.all([
    supabase
      .from("vendor_payment_config")
      .select("vendor_id, plan, kind, payee_name, label, created_at"),
    supabase.from("transactions").select("vendor_id"),
  ]);
  for (const r of [vendorsRes, txRes]) {
    if (r.error) throw new Error(`listVendors: ${r.error.message}`);
  }
  const vendors = vendorsRes.data ?? [];
  const transactions = txRes.data ?? [];
  const emails = await emailByUserId(supabase);

  const txCounts = new Map<string, number>();
  for (const t of transactions) {
    txCounts.set(t.vendor_id, (txCounts.get(t.vendor_id) ?? 0) + 1);
  }

  return vendors
    .map((v) => ({
      vendor_id: v.vendor_id,
      email: emails.get(v.vendor_id) ?? null,
      plan: v.plan,
      kind: v.kind,
      payee_name: v.payee_name,
      label: v.label,
      transaction_count: txCounts.get(v.vendor_id) ?? 0,
      created_at: v.created_at,
    }))
    .sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));
}

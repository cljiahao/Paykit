import { createServerClient } from "@/lib/supabase/server";
import type { Transaction } from "@/lib/types";

export async function listTransactions(
  vendorId: string,
): Promise<Transaction[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("listTransactions failed", error.message);
    return [];
  }
  return data ?? [];
}

export async function txCountThisMonth(vendorId: string): Promise<number> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("tx_count_this_month", {
    p_vendor: vendorId,
  });
  if (error) {
    console.error("txCountThisMonth failed", error.message);
    return 0;
  }
  return data ?? 0;
}

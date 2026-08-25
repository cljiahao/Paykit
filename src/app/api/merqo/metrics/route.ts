import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { bearerOk } from "@/lib/merqo-auth";
import { computePaykitMetrics } from "@/lib/metrics";
import type { TxStatus, VendorPlan } from "@/lib/types";

export const revalidate = 0;

export async function GET(request: Request) {
  if (!bearerOk(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();

  // Two independent reads — issue them concurrently so endpoint latency is
  // one round-trip, not the sum of two.
  const [vendorsRes, transactionsRes] = await Promise.all([
    supabase
      .from("vendor_payment_config")
      .select("vendor_id, plan, created_at"),
    supabase
      .from("transactions")
      .select("vendor_id, amount_cents, status, created_at"),
  ]);

  for (const r of [vendorsRes, transactionsRes]) {
    if (r.error) {
      console.error("merqo metrics: read failed", r.error.message);
      return NextResponse.json(
        { error: "Upstream unavailable" },
        { status: 503 },
      );
    }
  }

  const metrics = computePaykitMetrics({
    nowMs: Date.now(),
    vendors: (vendorsRes.data ?? []) as {
      vendor_id: string;
      plan: VendorPlan;
      created_at: string;
    }[],
    transactions: (transactionsRes.data ?? []) as {
      vendor_id: string;
      amount_cents: number;
      status: TxStatus;
      created_at: string;
    }[],
  });

  return NextResponse.json({
    product: "paykit",
    generated_at: new Date().toISOString(),
    ...metrics,
  });
}

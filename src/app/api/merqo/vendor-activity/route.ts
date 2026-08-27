import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { listAllUsers } from "@/lib/list-all-users";
import { bearerOk } from "@/lib/merqo-auth";
import { computeVendorActivity } from "@/lib/merqo-vendor-activity";
import type { TxStatus, VendorPlan } from "@/lib/types";

export const revalidate = 0;

const querySchema = z.object({ email: z.string().email() });

export async function GET(request: Request) {
  if (!bearerOk(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    email: searchParams.get("email") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const usersRes = await listAllUsers(supabase);
  if (usersRes.error) {
    console.error(
      "paykit vendor-activity: read failed",
      usersRes.error.message,
    );
    return NextResponse.json(
      { error: "Upstream unavailable" },
      { status: 503 },
    );
  }

  const key = parsed.data.email.toLowerCase();
  const user = (usersRes.data?.users ?? []).find(
    (u) => u.email?.toLowerCase() === key,
  );
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [configRes, transactionsRes] = await Promise.all([
    supabase
      .from("vendor_payment_config")
      .select("plan, created_at")
      .eq("vendor_id", user.id)
      .maybeSingle(),
    supabase
      .from("transactions")
      .select("id, status, amount_cents, created_at, confirmed_at")
      .eq("vendor_id", user.id),
  ]);
  if (configRes.error || transactionsRes.error) {
    console.error(
      "paykit vendor-activity: read failed",
      configRes.error?.message ?? transactionsRes.error?.message,
    );
    return NextResponse.json(
      { error: "Upstream unavailable" },
      { status: 503 },
    );
  }

  const transactions = (transactionsRes.data ?? []) as {
    id: string;
    status: TxStatus;
    amount_cents: number;
    created_at: string;
    confirmed_at: string | null;
  }[];

  // refunds has no vendor_id of its own — scope it via this vendor's own
  // transaction ids, same join-by-hand pattern vendor-health.ts's
  // buildVendorHealth uses across all vendors at once.
  const txIds = transactions.map((t) => t.id);
  let refunds: { created_at: string }[] = [];
  if (txIds.length > 0) {
    const refundsRes = await supabase
      .from("refunds")
      .select("created_at")
      .in("transaction_id", txIds);
    if (refundsRes.error) {
      console.error(
        "paykit vendor-activity: read failed",
        refundsRes.error.message,
      );
      return NextResponse.json(
        { error: "Upstream unavailable" },
        { status: 503 },
      );
    }
    refunds = refundsRes.data ?? [];
  }

  const config = configRes.data as {
    plan: VendorPlan;
    created_at: string;
  } | null;

  const payload = computeVendorActivity(
    config,
    transactions,
    refunds,
    Date.now(),
  );
  return NextResponse.json(payload);
}

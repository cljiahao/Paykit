import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyKitAuth } from "@/lib/kit-auth";
import { claimTransition, type TxStatus } from "@/lib/tx-state";
import { toStatusResponse } from "@/lib/api-schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyKitAuth(request);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = await createServiceClient();

  const { data: current, error: readError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (readError) {
    console.error("claim: read failed", readError.message);
    return NextResponse.json(
      { error: "Upstream unavailable" },
      { status: 503 },
    );
  }
  if (!current)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { status, changed } = claimTransition(current.status as TxStatus);
  if (!changed) return NextResponse.json(toStatusResponse(current));

  const { data: updated, error: updateError } = await supabase
    .from("transactions")
    .update({ status, claimed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending")
    .select("*")
    .single();
  if (updateError || !updated) {
    const { data: recheck } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!recheck)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(toStatusResponse(recheck));
  }

  return NextResponse.json(toStatusResponse(updated));
}

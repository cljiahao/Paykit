import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyKitAuth } from "@/lib/kit-auth";
import { uuidSchema, type BookingStatusResponse } from "@/lib/api-schemas";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ booking_id: string }> },
) {
  const auth = await verifyKitAuth(request);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { booking_id } = await params;
  if (!uuidSchema.safeParse(booking_id).success) {
    return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
  }

  const supabase = await createServiceClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      "id, status, event_date, deposit_amount_cents, balance_amount_cents, total_amount_cents, deposit_transaction_id, balance_transaction_id",
    )
    .eq("id", booking_id)
    .maybeSingle();
  if (error) {
    console.error("booking status: read failed", error.message);
    return NextResponse.json(
      { error: "Upstream unavailable" },
      { status: 503 },
    );
  }
  if (!booking)
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // Two transactions can share the same booking (deposit/balance) — a single
  // `.in()` lookup avoids two round trips.
  const txIds = [
    booking.deposit_transaction_id,
    booking.balance_transaction_id,
  ].filter((id): id is string => id !== null);

  let confirmedIds = new Set<string>();
  if (txIds.length > 0) {
    const { data: txs, error: txError } = await supabase
      .from("transactions")
      .select("id, status")
      .in("id", txIds);
    if (txError) {
      console.error("booking status: transaction read failed", txError.message);
      return NextResponse.json(
        { error: "Upstream unavailable" },
        { status: 503 },
      );
    }
    confirmedIds = new Set(
      (txs ?? []).filter((t) => t.status === "confirmed").map((t) => t.id),
    );
  }

  const body: BookingStatusResponse = {
    booking_id: booking.id,
    status: booking.status as BookingStatusResponse["status"],
    event_date: booking.event_date,
    deposit_amount_cents: booking.deposit_amount_cents,
    balance_amount_cents: booking.balance_amount_cents,
    total_amount_cents: booking.total_amount_cents,
    deposit_confirmed: booking.deposit_transaction_id
      ? confirmedIds.has(booking.deposit_transaction_id)
      : false,
    balance_confirmed: booking.balance_transaction_id
      ? confirmedIds.has(booking.balance_transaction_id)
      : false,
  };
  return NextResponse.json(body);
}

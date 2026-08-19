"use server";

import { revalidatePath } from "next/cache";
import { getVendorSession } from "@/lib/vendor-session";
import { createServiceClient } from "@/lib/supabase/server";
import { createCheckout } from "@/lib/checkout";
import {
  createBookingInputSchema,
  cancelBookingInputSchema,
  createBalanceCheckoutInputSchema,
} from "@/lib/schemas";
import { recordAudit } from "@/app/admin/actions";

export type BookingActionState = {
  status: "idle" | "ok" | "error";
  message?: string;
};

// Dollar inputs from the form, converted to cents — same pattern as
// `dashboard/transactions/actions.ts`'s `dollarsToCents`. `Number()` on an
// empty/non-numeric input yields `NaN`, which the schema's `z.coerce.number`
// then rejects with its own message, so no separate guard is needed here.
function dollarsToCents(raw: FormDataEntryValue | null): number {
  return Math.round(Number(raw) * 100);
}

const KIT_SLUG = "paykit";

export async function createBookingAction(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const { supabase, user } = await getVendorSession();

  const parsed = createBookingInputSchema.safeParse({
    customer_name: formData.get("customer_name") ?? "",
    customer_phone: formData.get("customer_phone") ?? "",
    event_date: formData.get("event_date") ?? "",
    balance_due_date: formData.get("balance_due_date") ?? "",
    total_amount_cents: dollarsToCents(formData.get("total_amount")),
    deposit_amount_cents: dollarsToCents(formData.get("deposit_amount")),
    balance_amount_cents: dollarsToCents(formData.get("balance_amount")),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { data: booking, error: insertError } = await supabase
    .from("bookings")
    .insert({
      vendor_id: user.id,
      customer_name: parsed.data.customer_name,
      customer_phone: parsed.data.customer_phone || null,
      event_date: parsed.data.event_date,
      total_amount_cents: parsed.data.total_amount_cents,
      deposit_amount_cents: parsed.data.deposit_amount_cents,
      balance_amount_cents: parsed.data.balance_amount_cents,
      balance_due_date: parsed.data.balance_due_date,
    })
    .select("id")
    .single();
  if (insertError || !booking) {
    console.error("createBookingAction: insert failed", insertError?.message);
    return { status: "error", message: "Could not create booking. Try again." };
  }

  const checkout = await createCheckout({
    vendorId: user.id,
    kitSlug: KIT_SLUG,
    orderRef: `booking:${booking.id}:deposit`,
    amountCents: parsed.data.deposit_amount_cents,
  });
  const service = await createServiceClient();
  if (!checkout.ok) {
    // The booking row can't do anything useful without a deposit checkout
    // (there's no separate "retry deposit checkout" action), so clean it up
    // rather than leaving an unusable half-created booking behind.
    await service.from("bookings").delete().eq("id", booking.id);
    console.error(
      "createBookingAction: deposit checkout failed",
      checkout.error,
    );
    return {
      status: "error",
      message: "Booking created, but the deposit checkout failed. Try again.",
    };
  }

  const { error: linkError } = await service
    .from("bookings")
    .update({ deposit_transaction_id: checkout.transaction_id })
    .eq("id", booking.id);
  if (linkError) {
    console.error(
      "createBookingAction: link deposit tx failed",
      linkError.message,
    );
    return {
      status: "error",
      message: "Booking created, but could not link the deposit checkout.",
    };
  }

  revalidatePath("/dashboard/bookings");
  return { status: "ok" };
}

export async function createBalanceCheckoutAction(
  bookingId: string,
): Promise<BookingActionState> {
  const { supabase, user } = await getVendorSession();

  const parsed = createBalanceCheckoutInputSchema.safeParse({
    booking_id: bookingId,
  });
  if (!parsed.success) {
    return { status: "error", message: "Invalid booking" };
  }

  const { data: booking, error: readError } = await supabase
    .from("bookings")
    .select(
      "id, balance_amount_cents, deposit_transaction_id, balance_transaction_id",
    )
    .eq("id", parsed.data.booking_id)
    .maybeSingle();
  if (readError || !booking) {
    return { status: "error", message: "Booking not found" };
  }
  if (!booking.deposit_transaction_id) {
    return {
      status: "error",
      message: "Create the deposit checkout before the balance checkout.",
    };
  }
  if (booking.balance_transaction_id) {
    return { status: "error", message: "Balance checkout already created." };
  }

  const checkout = await createCheckout({
    vendorId: user.id,
    kitSlug: KIT_SLUG,
    orderRef: `booking:${booking.id}:balance`,
    amountCents: booking.balance_amount_cents,
  });
  if (!checkout.ok) {
    console.error(
      "createBalanceCheckoutAction: checkout failed",
      checkout.error,
    );
    return {
      status: "error",
      message: "Could not create the balance checkout.",
    };
  }

  const service = await createServiceClient();
  const { error: linkError } = await service
    .from("bookings")
    .update({ balance_transaction_id: checkout.transaction_id })
    .eq("id", booking.id);
  if (linkError) {
    console.error(
      "createBalanceCheckoutAction: link failed",
      linkError.message,
    );
    return { status: "error", message: "Could not link the balance checkout." };
  }

  revalidatePath(`/dashboard/bookings/${booking.id}`);
  revalidatePath("/dashboard/bookings");
  return { status: "ok" };
}

export async function cancelBookingAction(
  bookingId: string,
  reason?: string,
): Promise<BookingActionState> {
  const { supabase, user } = await getVendorSession();

  const parsed = cancelBookingInputSchema.safeParse({
    booking_id: bookingId,
    reason: reason ?? "",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", parsed.data.booking_id);
  if (error) {
    console.error("cancelBookingAction failed", error.message);
    return { status: "error", message: "Could not cancel booking." };
  }

  await recordAudit(user.id, "cancel_booking", parsed.data.booking_id, {
    reason: parsed.data.reason || null,
  });

  revalidatePath(`/dashboard/bookings/${parsed.data.booking_id}`);
  revalidatePath("/dashboard/bookings");
  return { status: "ok" };
}

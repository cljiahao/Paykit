"use server";

import { revalidatePath } from "next/cache";
import { getVendorSession } from "@/lib/vendor-session";
import { issueRefundInputSchema } from "@/lib/schemas";

export type RefundState = { status: "idle" | "ok" | "error"; message?: string };

// The form collects a dollar amount (matching how every other money value in
// the dashboard displays, see `transaction-table.tsx`'s `formatCents`), but
// `refunded_amount_cents` — and `issueRefundInputSchema` below — stay
// cents-denominated: that's the DB column's unit. `Number()` on an empty/
// non-numeric input yields `NaN`, which `Math.round` propagates; the schema's
// `z.coerce.number` then rejects `NaN` with its own "Enter a valid refund
// amount." message, so no separate guard is needed here.
function dollarsToCents(raw: FormDataEntryValue | null): number {
  return Math.round(Number(raw) * 100);
}

// Relies on the `refunds_insert_own` RLS policy (Task 4) to be the real
// enforcement: it checks ownership, `transactions.status = 'confirmed'`, and
// `vendor_payment_config.plan = 'pro'` at the DB layer via `with check`. This
// action only validates shape/UX — never trust a client-supplied "I'm Pro"
// flag, and never widen the policy to make this insert succeed.
export async function issueRefundAction(
  _prev: RefundState,
  formData: FormData,
): Promise<RefundState> {
  const { supabase, user } = await getVendorSession();
  const parsed = issueRefundInputSchema.safeParse({
    transaction_id: formData.get("transaction_id") ?? "",
    refunded_amount_cents: dollarsToCents(formData.get("refunded_amount")),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Enter a valid refund amount.",
    };
  }

  const { error } = await supabase.from("refunds").insert({
    transaction_id: parsed.data.transaction_id,
    refunded_amount_cents: parsed.data.refunded_amount_cents,
    reason: parsed.data.reason || null,
    created_by: user.id,
  });
  if (error) {
    console.error("issueRefundAction failed", error.message);
    return {
      status: "error",
      message:
        "Could not record refund — check the transaction is confirmed and you're on Pro.",
    };
  }
  revalidatePath("/dashboard/transactions");
  return { status: "ok" };
}

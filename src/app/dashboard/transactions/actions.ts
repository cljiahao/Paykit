"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { issueRefundInputSchema } from "@/lib/schemas";

export type RefundState = { status: "idle" | "ok" | "error"; message?: string };

async function requireVendor() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
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
  const { supabase, user } = await requireVendor();
  const parsed = issueRefundInputSchema.safeParse({
    transaction_id: formData.get("transaction_id") ?? "",
    refunded_amount_cents: formData.get("refunded_amount_cents") ?? "",
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
  return { status: "ok" };
}

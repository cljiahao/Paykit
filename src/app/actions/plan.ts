"use server";

import { createServerClient } from "@/lib/supabase/server";
import { submitSupportMessage } from "@/lib/merqo-support";
import type { ActionResult } from "@/lib/action-result";

/**
 * "Ask us to upgrade to Pro" CTA on the plan page. paykit has no
 * upgrade_requests table (and no payment-provider integration to sell Pro
 * through) — it files the request through the same merqo.submit_support_message
 * mechanism the account-menu "Get help" flow already uses (category
 * "billing" — see SUPPORT_CATEGORY_LABELS), which is the existing,
 * appropriately-sized way to record a vendor request against paykit's
 * actual schema, no new table required.
 */
export async function requestProUpgradeAction(): Promise<ActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Please sign in first" };

  try {
    await submitSupportMessage(
      supabase,
      "billing",
      "Requesting an upgrade to the Pro plan.",
    );
  } catch (err) {
    console.error(
      "requestProUpgradeAction failed",
      err instanceof Error ? err.message : err,
    );
    return { success: false, error: "Could not send your request" };
  }
  return { success: true };
}

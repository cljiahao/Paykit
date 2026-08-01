"use server";

import { createServerClient } from "@/lib/supabase/server";

/**
 * Mark the dashboard onboarding tour as seen for the current vendor, so it
 * stops auto-running on first login. Best-effort: this is cosmetic, so a
 * failure is logged but never surfaced — the worst case is the tour shows
 * once more. RLS scopes the upsert to the vendor's own row
 * (vendor_id = auth.uid()). Unlike Qkit/Stockkit's ALTER-existing-table
 * approach, paykit.vendor_prefs starts with no row for any vendor, so this
 * upserts rather than updates.
 */
export async function markTourSeen(): Promise<void> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("vendor_prefs")
    .upsert({ vendor_id: user.id, tour_seen_at: new Date().toISOString() });

  if (error) console.error("markTourSeen failed", error.message);
}

import { createServerClient } from "@/lib/supabase/server";

type VendorSupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

/**
 * Upsert `tour_seen_at = now()` for a vendor. Best-effort: this is cosmetic,
 * so a failure is logged but never surfaced — the worst case is the tour
 * shows once more. RLS scopes the upsert to the vendor's own row
 * (vendor_id = auth.uid()). Unlike Qkit/Stockkit's ALTER-existing-table
 * approach, paykit.vendor_prefs starts with no row for any vendor, so this
 * upserts rather than updates.
 *
 * Shared by two callers: `src/app/dashboard/tour-actions.ts`'s
 * `markTourSeen` (the client-fired, fire-and-forget path) and
 * `src/app/dashboard/page.tsx`'s own server render (the durable path — see
 * that file for why the client-fired path alone isn't reliable). Kept in a
 * plain (non-`"use server"`) module rather than inlined in `tour-actions.ts`
 * so `page.tsx` can call it directly during SSR without crossing a Server
 * Action's client/server serialization boundary — `dashboard-tour.tsx` (a
 * Client Component) imports `markTourSeen` from that file, which would pull
 * this function into the client bundle graph too if it lived there.
 */
export async function stampTourSeen(
  supabase: VendorSupabaseClient,
  vendorId: string,
): Promise<void> {
  const { error } = await supabase
    .from("vendor_prefs")
    .upsert({ vendor_id: vendorId, tour_seen_at: new Date().toISOString() });

  if (error) console.error("markTourSeen failed", error.message);
}

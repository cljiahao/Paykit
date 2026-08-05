import type { SupabaseClient } from "@supabase/supabase-js";
import { callMerqoRpc } from "@/lib/merqo-rpc";

/**
 * Shape of the merqo.submit_vendor_feedback RPC — merqo owns this
 * function's real generated types; this is a hand-written mirror of the
 * RPC contract, not a generated type, since merqo.* is outside paykit's
 * own supabase gen types scope (schema: "paykit"). See
 * merqo/docs/superpowers/specs/2026-07-23-cross-kit-vendor-feedback-design.md.
 */
type SubmitVendorFeedbackArgs = {
  p_kit_slug: string;
  p_nps: number;
  p_message: string | null;
};
type SubmitVendorFeedbackReturns = { id: string };

/**
 * Callers pass in a client already scoped to their own (paykit) Database
 * and schema name — same generic-over-caller's-client pattern as
 * merqo-vendor-profile.ts and merqo-support.ts, for the same reason (a bare
 * SupabaseClient defaults its schema-name param to "public", which a real
 * caller scoped to "paykit" doesn't structurally match). See `merqo-rpc.ts`
 * for the shared `.schema("merqo").rpc(...)` caller this delegates to.
 */
export async function submitVendorFeedback<
  Db,
  SchemaName extends string & Exclude<keyof Db, "__InternalSupabase">,
>(
  supabase: SupabaseClient<Db, SchemaName>,
  kitSlug: string,
  nps: number,
  message: string | null,
): Promise<void> {
  await callMerqoRpc<
    SubmitVendorFeedbackArgs,
    SubmitVendorFeedbackReturns,
    Db,
    SchemaName
  >(supabase, "submit_vendor_feedback", {
    p_kit_slug: kitSlug,
    p_nps: nps,
    p_message: message,
  });
}

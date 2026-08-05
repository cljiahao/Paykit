import type { SupabaseClient } from "@supabase/supabase-js";
import { callMerqoRpc } from "@/lib/merqo-rpc";

/**
 * Shape of the merqo.submit_support_message RPC — merqo owns this
 * function's real generated types; this is a hand-written mirror of the
 * RPC contract, not a generated type, since merqo.* is outside paykit's
 * own supabase gen types scope (schema: "paykit"). See
 * merqo/docs/superpowers/specs/2026-07-23-cross-kit-support-messages-design.md.
 */
type SubmitSupportMessageArgs = {
  p_kit_slug: string;
  p_category: string;
  p_body: string;
};
type SubmitSupportMessageReturns = { id: string };

/**
 * Callers pass in a client already scoped to their own (paykit) Database
 * and schema name — same generic-over-caller's-client pattern as
 * merqo-vendor-profile.ts, for the same reason (a bare SupabaseClient
 * defaults its schema-name param to "public", which a real caller scoped
 * to "paykit" doesn't structurally match). See `merqo-rpc.ts` for the
 * shared `.schema("merqo").rpc(...)` caller this delegates to.
 */
export async function submitSupportMessage<
  Db,
  SchemaName extends string & Exclude<keyof Db, "__InternalSupabase">,
>(
  supabase: SupabaseClient<Db, SchemaName>,
  category: string,
  body: string,
): Promise<void> {
  await callMerqoRpc<
    SubmitSupportMessageArgs,
    SubmitSupportMessageReturns,
    Db,
    SchemaName
  >(supabase, "submit_support_message", {
    p_kit_slug: "paykit",
    p_category: category,
    p_body: body,
  });
}

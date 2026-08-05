import type { SupabaseClient, PostgrestError } from "@supabase/supabase-js";

/**
 * Shared caller for the `merqo` schema's cross-kit RPCs
 * (`merqo-support.ts`, `merqo-vendor-feedback.ts`, `merqo-vendor-profile.ts`).
 * Callers pass in a client already scoped to their own (e.g. paykit)
 * Database and schema name — this file must accept whatever concrete
 * instantiation that is. A bare `SupabaseClient` defaults its schema-name
 * param to `"public"`, which real callers (scoped to `"paykit"`) don't
 * structurally match, and pinning params to `never` doesn't match either.
 * Declaring this function generic over the caller's own Database/SchemaName
 * lets each call site's concrete client type flow in unchanged; the body
 * then re-asserts it against a minimal `{ rpc }` shape for the one
 * cross-schema call — merqo's real RPC generated types aren't visible from
 * paykit's own `supabase gen types` scope (schema: "paykit"), so `Args`/
 * `Returns` are the caller's own hand-written mirror of the RPC contract,
 * not generated types.
 */
type MerqoSchemaClient<Args, Returns> = {
  schema: (schemaName: "merqo") => {
    rpc: (
      fnName: string,
      args: Args,
    ) => Promise<{ data: Returns; error: PostgrestError | null }>;
  };
};

export async function callMerqoRpc<
  Args,
  Returns,
  Db,
  SchemaName extends string & Exclude<keyof Db, "__InternalSupabase">,
>(
  supabase: SupabaseClient<Db, SchemaName>,
  fnName: string,
  args: Args,
): Promise<Returns> {
  const merqoClient = supabase as unknown as MerqoSchemaClient<Args, Returns>;
  const { data, error } = await merqoClient.schema("merqo").rpc(fnName, args);
  if (error) {
    throw new Error(`${fnName} failed: ${error.message}`);
  }
  return data;
}

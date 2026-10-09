import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/types";

/** Internal audit writer. Callers supply an actor only after their own authenticated boundary. */
export async function recordAudit(
  adminId: string,
  action: string,
  targetId: string | null,
  detail: Json,
): Promise<void> {
  try {
    const supabase = await createServiceClient();
    const { error } = await supabase
      .from("admin_audit")
      .insert({ admin_id: adminId, action, target_id: targetId, detail });
    if (error) console.error("admin_audit insert failed", error.message);
  } catch {
    console.error("admin_audit unavailable");
  }
}

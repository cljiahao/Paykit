import { createHash, timingSafeEqual } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { clientIp } from "@/lib/rate-limit";

export function hashApiKey(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

type ServiceClient = Awaited<ReturnType<typeof createServiceClient>>;

/**
 * Best-effort append of one auth_failures row — never throws, never blocks
 * the caller. verifyKitAuth's real job is to authenticate a request, not to
 * guarantee an audit write; a degraded logging path must never turn into a
 * false-negative auth failure.
 */
async function logAuthFailure(
  supabase: ServiceClient,
  kitSlug: string | null,
  reason: string,
  ip: string,
): Promise<void> {
  const { error } = await supabase
    .from("auth_failures")
    .insert({ kit_slug: kitSlug, reason, ip });
  if (error) console.error("auth_failures insert failed", error.message);
}

export async function verifyKitAuth(
  request: Request,
): Promise<{ kitSlug: string } | null> {
  const supabase = await createServiceClient();
  const ip = clientIp(request.headers);

  const header = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) {
    const reason = "missing/malformed Authorization header";
    console.warn(`paykit: verifyKitAuth failed — ${reason}`);
    await logAuthFailure(supabase, null, reason, ip);
    return null;
  }

  const token = header.slice(prefix.length);
  const sep = token.indexOf(":");
  if (sep <= 0) {
    const reason = "malformed bearer token";
    console.warn(`paykit: verifyKitAuth failed — ${reason}`);
    await logAuthFailure(supabase, null, reason, ip);
    return null;
  }
  const kitSlug = token.slice(0, sep);
  const secret = token.slice(sep + 1);
  if (!kitSlug || !secret) {
    const reason = "malformed bearer token";
    console.warn(`paykit: verifyKitAuth failed — ${reason}`);
    await logAuthFailure(supabase, null, reason, ip);
    return null;
  }

  const { data, error } = await supabase
    .from("kit_api_keys")
    .select("secret_hash")
    .eq("kit_slug", kitSlug)
    .maybeSingle();
  if (error || !data) {
    const reason = "unknown kit_slug";
    console.warn(`paykit: verifyKitAuth failed — ${reason} "${kitSlug}"`);
    await logAuthFailure(supabase, kitSlug, reason, ip);
    return null;
  }

  const provided = Buffer.from(hashApiKey(secret));
  const expected = Buffer.from(data.secret_hash);
  const ok =
    provided.length === expected.length && timingSafeEqual(provided, expected);
  if (!ok) {
    const reason = "secret mismatch";
    console.warn(
      `paykit: verifyKitAuth failed — ${reason} for kit_slug "${kitSlug}"`,
    );
    await logAuthFailure(supabase, kitSlug, reason, ip);
    return null;
  }

  // Best-effort — a failed write here must never fail a real auth success.
  const { error: touchError } = await supabase
    .from("kit_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("kit_slug", kitSlug);
  if (touchError)
    console.warn(
      `paykit: verifyKitAuth — last_used_at update failed for kit_slug "${kitSlug}"`,
      touchError.message,
    );

  return { kitSlug };
}

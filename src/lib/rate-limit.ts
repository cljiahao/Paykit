import type { createServiceClient } from "@/lib/supabase/server";

/**
 * Resolve a best-effort client IP from request headers: the first hop of
 * `x-forwarded-for`, else `x-real-ip`, else the literal "unknown". This is NOT
 * trusted (either header is client-spoofable behind a permissive proxy) — it's
 * a coarse fairness key for the flood guard, not an authz signal. Ported
 * verbatim from qkit's own `src/lib/rate-limit.ts`.
 */
export function clientIp(hdrs: Headers): string {
  return (
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Fixed-window rate-limit check via the DB limiter (`check_rate_limit`). Returns
 * true when the call is allowed. Fails OPEN — any limiter error (infra hiccup)
 * yields `true` so a real calling kit is never blocked by a degraded limiter.
 * The limiter is defence against a leaked/misbehaving bearer secret, not a
 * correctness gate.
 */
export async function rateLimit(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data: allowed, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) console.error("rateLimit degraded (failing open)", error.message);
  return allowed !== false;
}

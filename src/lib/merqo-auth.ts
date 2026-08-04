import { timingSafeEqual } from "node:crypto";

/** Constant-time bearer check against MERQO_METRICS_SECRET. */
export function bearerOk(request: Request): boolean {
  const secret = process.env.MERQO_METRICS_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return false;
  const provided = Buffer.from(header.slice(prefix.length));
  const expected = Buffer.from(secret);
  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  );
}

/** Constant-time bearer check against MERQO_PROVISION_SECRET — deliberately a
 *  DIFFERENT env var from bearerOk's MERQO_METRICS_SECRET, matching qkit/
 *  loopkit's convention: a leak of the routine metrics-polling secret must
 *  not also grant access to the provision route. */
export function provisionBearerOk(request: Request): boolean {
  const secret = process.env.MERQO_PROVISION_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return false;
  const provided = Buffer.from(header.slice(prefix.length));
  const expected = Buffer.from(secret);
  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  );
}

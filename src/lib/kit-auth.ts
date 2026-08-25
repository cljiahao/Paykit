import { createHash, timingSafeEqual } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";

export function hashApiKey(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

export async function verifyKitAuth(
  request: Request,
): Promise<{ kitSlug: string } | null> {
  const header = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) {
    console.warn(
      "paykit: verifyKitAuth failed — missing/malformed Authorization header",
    );
    return null;
  }

  const token = header.slice(prefix.length);
  const sep = token.indexOf(":");
  if (sep <= 0) {
    console.warn("paykit: verifyKitAuth failed — malformed bearer token");
    return null;
  }
  const kitSlug = token.slice(0, sep);
  const secret = token.slice(sep + 1);
  if (!kitSlug || !secret) {
    console.warn("paykit: verifyKitAuth failed — malformed bearer token");
    return null;
  }

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("kit_api_keys")
    .select("secret_hash")
    .eq("kit_slug", kitSlug)
    .maybeSingle();
  if (error || !data) {
    console.warn(
      `paykit: verifyKitAuth failed — unknown kit_slug "${kitSlug}"`,
    );
    return null;
  }

  const provided = Buffer.from(hashApiKey(secret));
  const expected = Buffer.from(data.secret_hash);
  const ok =
    provided.length === expected.length && timingSafeEqual(provided, expected);
  if (!ok) {
    console.warn(
      `paykit: verifyKitAuth failed — secret mismatch for kit_slug "${kitSlug}"`,
    );
    return null;
  }
  return { kitSlug };
}

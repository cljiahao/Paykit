#!/usr/bin/env node
import { randomBytes, createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

export function parseKitKeyArgs(args) {
  const slugs = args.filter((argument) => !argument.startsWith("--"));
  if (
    slugs.length !== 1 ||
    args.some(
      (argument) => argument.startsWith("--") && argument !== "--rotate",
    ) ||
    args.filter((argument) => argument === "--rotate").length > 1 ||
    !/^[a-z][a-z0-9-]{0,63}$/.test(slugs[0])
  ) {
    throw new Error(
      "Usage: node scripts/create-kit-key.mjs <kit_slug> [--rotate]",
    );
  }
  return { kitSlug: slugs[0], rotate: args.includes("--rotate") };
}

export async function provisionKitKey(supabase, { kitSlug, rotate }) {
  const secret = randomBytes(32).toString("hex");
  const secretHash = createHash("sha256").update(secret, "utf8").digest("hex");
  const table = supabase.from("kit_api_keys");
  const operation = rotate
    ? table
        .update({ secret_hash: secretHash })
        .eq("kit_slug", kitSlug)
        .select("kit_slug")
        .single()
    : table.insert({ kit_slug: kitSlug, secret_hash: secretHash });
  const { error } = await operation;
  if (error) {
    if (!rotate && error.code === "23505")
      throw new Error(
        "This kit already has a key. Use --rotate only for a coordinated cutover.",
      );
    if (rotate && error.code === "PGRST116")
      throw new Error(
        "No existing key found for rotation. Provision the kit without --rotate.",
      );
    throw new Error("Failed to store the kit key.");
  }
  return secret;
}

async function main() {
  const options = parseKitKeyArgs(process.argv.slice(2));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey)
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY first.",
    );
  const supabase = createClient(url, secretKey, { db: { schema: "paykit" } });
  const secret = await provisionKitKey(supabase, options);
  console.log(
    `Bearer token for ${options.kitSlug} (save this now, shown once):`,
  );
  console.log(`${options.kitSlug}:${secret}`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

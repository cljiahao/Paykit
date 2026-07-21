"use server";

import { revalidatePath } from "next/cache";
import { getVendorSession } from "@/lib/vendor-session";
import {
  getOrCreateVendorProfile,
  upsertVendorProfile,
} from "@/lib/merqo-vendor-profile";
import {
  profileNameSchema,
  socialLinksSchema,
  type ProfileNameInput,
  type SocialLinksInput,
} from "@/lib/schemas";
import type { ActionResult } from "@/lib/action-result";

/**
 * Update the vendor's shared stall/shop name. Persisted in
 * merqo.vendor_profile (shared across every kit — see `Merqo Business/docs/
 * business/2026-07-21-profile-settings-page-standard.md`) via the
 * upsert_vendor_profile RPC, not a paykit-local table write (paykit has no
 * local vendors table — vendor_id is just the auth user id).
 */
export async function updateStallName(
  input: ProfileNameInput,
): Promise<ActionResult> {
  const parsed = profileNameSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid stall name",
    };

  const { supabase, user } = await getVendorSession();

  try {
    const current = await getOrCreateVendorProfile(supabase, user.id, null);
    await upsertVendorProfile(
      supabase,
      user.id,
      parsed.data.name,
      current.social_links,
    );
  } catch (err) {
    console.error(
      "updateStallName failed",
      err instanceof Error ? err.message : err,
    );
    return { success: false, error: "Could not save stall name" };
  }

  revalidatePath("/dashboard/profile");
  return { success: true };
}

/**
 * Update the vendor's profile-level social/website links. Same
 * merqo.vendor_profile write path as updateStallName.
 */
export async function updateSocialLinks(
  input: SocialLinksInput,
): Promise<ActionResult> {
  const parsed = socialLinksSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid links",
    };

  const { supabase, user } = await getVendorSession();

  try {
    const current = await getOrCreateVendorProfile(supabase, user.id, null);
    await upsertVendorProfile(
      supabase,
      user.id,
      current.stall_name,
      parsed.data,
    );
  } catch (err) {
    console.error(
      "updateSocialLinks failed",
      err instanceof Error ? err.message : err,
    );
    return { success: false, error: "Could not save links" };
  }

  revalidatePath("/dashboard/profile");
  return { success: true };
}

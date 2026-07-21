import { z } from "zod";
import type { SocialLinks } from "@/lib/types";

export const vendorPaymentConfigInputSchema = z
  .object({
    payee_name: z.string().trim().min(1, "Payee name is required").max(100),
    uen: z
      .string()
      .trim()
      .regex(/^[0-9A-Za-z]{8,12}$/, "Invalid UEN")
      .optional()
      .or(z.literal("")),
    mobile: z
      .string()
      .trim()
      .regex(/^\+65[0-9]{8}$/, "Use +65XXXXXXXX")
      .optional()
      .or(z.literal("")),
  })
  .transform((v) => ({
    payee_name: v.payee_name,
    uen: v.uen || undefined,
    mobile: v.mobile || undefined,
  }))
  .refine((v) => Boolean(v.uen) !== Boolean(v.mobile), {
    message: "Provide either a UEN or a mobile number, not both",
    path: ["uen"],
  });

export type VendorPaymentConfigInput = z.infer<
  typeof vendorPaymentConfigInputSchema
>;

// Postgres `integer` (int4) upper bound — refunded_amount_cents is stored in
// an `integer` column (supabase/migrations/0001_paykit_core.sql), so this
// keeps the Zod boundary in sync with what the DB will actually accept.
const PG_INT4_MAX = 2147483647;

export const issueRefundInputSchema = z.object({
  transaction_id: z.string().uuid("Invalid transaction"),
  refunded_amount_cents: z.coerce
    .number({ invalid_type_error: "Enter a valid refund amount." })
    .int("Enter a valid refund amount.")
    .positive("Enter a valid refund amount.")
    .max(PG_INT4_MAX, "Amount is too large."),
  reason: z
    .string()
    .trim()
    .max(500, "Reason is too long")
    .optional()
    .or(z.literal("")),
});

export type IssueRefundInput = z.infer<typeof issueRefundInputSchema>;

// ── Profile settings (dashboard/profile) ─────────────────────────────────
// Cross-kit standard, not paykit-specific — see `Merqo Business/docs/business/
// 2026-07-21-profile-settings-page-standard.md`. Stall/shop name + social
// links persist to the shared `merqo.vendor_profile` table (via
// merqo-vendor-profile.ts); display name, avatar, password live on the
// Supabase auth user and are written client-side.

export const profileNameSchema = z.object({
  name: z.string().trim().min(1, "Stall / shop name is required").max(100),
});
export type ProfileNameInput = z.infer<typeof profileNameSchema>;

// Optional: an empty string clears it. Trimmed so trailing whitespace can't
// slip past max.
export const displayNameSchema = z.object({
  displayName: z.string().trim().max(60, "Display name is too long"),
});
export type DisplayNameInput = z.infer<typeof displayNameSchema>;

// New password + confirm. Min length mirrors Supabase auth's own minimum (8);
// confirm must match.
export const passwordChangeSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

const socialUrl = z
  .string()
  .trim()
  .url("Enter a valid URL")
  .max(300)
  .optional()
  .or(z.literal(""));

export const socialLinksSchema = z.object({
  website: socialUrl,
  instagram: socialUrl,
  facebook: socialUrl,
  tiktok: socialUrl,
});
export type SocialLinksInput = z.infer<typeof socialLinksSchema>;

/** Parse a JSONB social_links value; any malformed shape degrades to {}. */
export function parseSocialLinks(data: unknown): SocialLinks {
  const parsed = socialLinksSchema.safeParse(data);
  return parsed.success ? parsed.data : {};
}

export const feedbackSchema = z.object({
  nps: z.number().int().min(0).max(10),
  message: z.string().trim().max(2000).optional(),
});
export type FeedbackInput = z.infer<typeof feedbackSchema>;

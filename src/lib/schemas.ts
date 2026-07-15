import { z } from "zod";

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

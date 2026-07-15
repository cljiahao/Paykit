import { z } from "zod";

export const txStatusSchema = z.enum(["pending", "claimed", "confirmed"]);

export const checkoutRequestSchema = z.object({
  vendor_id: z.string().uuid(),
  amount_cents: z.number().int().positive(),
  order_ref: z.string().trim().min(1).max(200),
});
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

export const checkoutResponseSchema = z.object({
  transaction_id: z.string().uuid(),
  qr_payload: z.string().min(1),
});
export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;

export const transactionStatusResponseSchema = z.object({
  transaction_id: z.string(),
  status: txStatusSchema,
  amount_cents: z.number().int().positive(),
  order_ref: z.string(),
  kit_slug: z.string(),
  claimed_at: z.string().nullable(),
  confirmed_at: z.string().nullable(),
  created_at: z.string(),
});
export type TransactionStatusResponse = z.infer<
  typeof transactionStatusResponseSchema
>;

export const vendorConfigResponseSchema = z.object({
  has_config: z.boolean(),
  payee_name: z.string().nullable(),
});
export type VendorConfigResponse = z.infer<typeof vendorConfigResponseSchema>;

export const errorResponseSchema = z.object({ error: z.string() });

type TransactionRow = {
  id: string;
  status: string;
  amount_cents: number;
  order_ref: string;
  kit_slug: string;
  claimed_at: string | null;
  confirmed_at: string | null;
  created_at: string;
};

/** Maps a `paykit.transactions` row to the `/api/v1/checkout/*` wire shape. */
export function toStatusResponse(
  row: TransactionRow,
): TransactionStatusResponse {
  return {
    transaction_id: row.id,
    status: row.status as TransactionStatusResponse["status"],
    amount_cents: row.amount_cents,
    order_ref: row.order_ref,
    kit_slug: row.kit_slug,
    claimed_at: row.claimed_at,
    confirmed_at: row.confirmed_at,
    created_at: row.created_at,
  };
}

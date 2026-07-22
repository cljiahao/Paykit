import { z } from "zod";

export const txStatusSchema = z.enum(["pending", "claimed", "confirmed"]);

/** Shared UUID validator for path params (`transactions.id`, `vendor_payment_config.vendor_id`) — a malformed value is a 400, not a DB-error 503. */
export const uuidSchema = z.string().uuid();

export const checkoutRequestSchema = z.object({
  vendor_id: uuidSchema,
  amount_cents: z.number().int().positive(),
  order_ref: z.string().trim().min(1).max(200),
});
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

export const checkoutResponseSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("qr"),
    transaction_id: z.string().uuid(),
    payload: z.string().min(1),
  }),
  z.object({
    type: z.literal("link"),
    transaction_id: z.string().uuid(),
    url: z.string().url(),
    label: z.string(),
  }),
  z.object({
    type: z.literal("image"),
    transaction_id: z.string().uuid(),
    url: z.string().url(),
  }),
]);
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
  display_name: z.string().nullable(),
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

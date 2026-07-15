import { buildPayNowPayload } from "./paynow";
import type { VendorPaymentConfig } from "@/lib/types";

export interface PaymentAdapter {
  kind: "paynow";
  renderCheckout(
    config: VendorPaymentConfig,
    ctx: { amountCents: number; orderRef: string },
  ): { type: "qr"; payload: string };
}

export const paynowAdapter: PaymentAdapter = {
  kind: "paynow",
  renderCheckout(config, ctx) {
    const payload = buildPayNowPayload({
      uen: config.uen ?? undefined,
      mobile: config.mobile ?? undefined,
      payeeName: config.payee_name,
      amountCents: ctx.amountCents,
      reference: ctx.orderRef,
    });
    return { type: "qr", payload };
  },
};

/**
 * verification_method: 'auto' is schema-reserved — the vendor config write
 * schema (Task 6) never lets a vendor select it, so this is never called in
 * v1. Same dark-adapter precedent as qkit's unbuilt Stripe slot: the shape
 * exists so a real bank-API integration later doesn't touch the checkout
 * flow, but nothing invokes it until that integration exists.
 */
export function autoVerify(): never {
  throw new Error("auto-verify not enabled");
}

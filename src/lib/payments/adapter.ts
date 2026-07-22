import { buildPayNowPayload } from "./paynow";
import type { VendorPaymentConfig } from "@/lib/types";

export type CheckoutView =
  | { type: "qr"; payload: string }
  | { type: "link"; url: string; label: string }
  | { type: "image"; url: string };

/**
 * Ported from qkit's own `src/lib/payments/adapters.ts` — same shape,
 * same "extract, don't rebuild" precedent paykit's PayNow engine itself
 * followed. Returns null for a `pointer` config missing both destinations
 * — callers treat null as "checkout not available," no throw.
 */
export function renderCheckout(
  config: VendorPaymentConfig,
  ctx: { amountCents: number; orderRef: string },
): CheckoutView | null {
  switch (config.kind) {
    case "paynow":
      return {
        type: "qr",
        payload: buildPayNowPayload({
          uen: config.uen ?? undefined,
          mobile: config.mobile ?? undefined,
          payeeName: config.payee_name ?? "",
          amountCents: ctx.amountCents,
          reference: ctx.orderRef,
        }),
      };
    case "pointer":
      if (config.url)
        return { type: "link", url: config.url, label: config.label ?? "" };
      if (config.qr_image_url)
        return { type: "image", url: config.qr_image_url };
      return null;
  }
}

/**
 * verification_method: 'auto' is schema-reserved — the vendor config write
 * schema never lets a vendor select it, so this is never called in v1.
 * Same dark-adapter precedent as qkit's unbuilt Stripe slot.
 */
export function autoVerify(): never {
  throw new Error("auto-verify not enabled");
}

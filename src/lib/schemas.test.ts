import { describe, it, expect } from "vitest";
import {
  vendorPaymentConfigInputSchema,
  issueRefundInputSchema,
  supportMessageSchema,
} from "./schemas";

describe("vendorPaymentConfigInputSchema", () => {
  describe("kind: paynow", () => {
    it("accepts a valid UEN-only config", () => {
      const parsed = vendorPaymentConfigInputSchema.safeParse({
        kind: "paynow",
        payee_name: "Kopitiam Cart",
        uen: "53312345A",
        mobile: "",
      });
      expect(parsed.success).toBe(true);
    });

    it("accepts a valid mobile-only config", () => {
      const parsed = vendorPaymentConfigInputSchema.safeParse({
        kind: "paynow",
        payee_name: "Kopitiam Cart",
        uen: "",
        mobile: "+6591234567",
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects both uen and mobile set", () => {
      const parsed = vendorPaymentConfigInputSchema.safeParse({
        kind: "paynow",
        payee_name: "Kopitiam Cart",
        uen: "53312345A",
        mobile: "+6591234567",
      });
      expect(parsed.success).toBe(false);
    });

    it("rejects neither uen nor mobile set", () => {
      const parsed = vendorPaymentConfigInputSchema.safeParse({
        kind: "paynow",
        payee_name: "Kopitiam Cart",
        uen: "",
        mobile: "",
      });
      expect(parsed.success).toBe(false);
    });

    it("rejects an invalid UEN format", () => {
      const parsed = vendorPaymentConfigInputSchema.safeParse({
        kind: "paynow",
        payee_name: "Kopitiam Cart",
        uen: "!!!",
        mobile: "",
      });
      expect(parsed.success).toBe(false);
    });

    it("rejects an empty payee name", () => {
      const parsed = vendorPaymentConfigInputSchema.safeParse({
        kind: "paynow",
        payee_name: "",
        uen: "53312345A",
        mobile: "",
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("kind: pointer", () => {
    it("accepts a valid payment-link config", () => {
      const parsed = vendorPaymentConfigInputSchema.safeParse({
        kind: "pointer",
        label: "Pay with PayLah",
        url: "https://pay.example/kopitiam",
      });
      expect(parsed.success).toBe(true);
    });

    it("accepts a valid QR-image config", () => {
      const parsed = vendorPaymentConfigInputSchema.safeParse({
        kind: "pointer",
        label: "Scan our QR",
        qr_image_url: "https://cdn.example/qr.webp",
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects both url and qr_image_url set", () => {
      const parsed = vendorPaymentConfigInputSchema.safeParse({
        kind: "pointer",
        label: "Pay",
        url: "https://pay.example/kopitiam",
        qr_image_url: "https://cdn.example/qr.webp",
      });
      expect(parsed.success).toBe(false);
    });

    it("rejects neither url nor qr_image_url set", () => {
      const parsed = vendorPaymentConfigInputSchema.safeParse({
        kind: "pointer",
        label: "Pay",
      });
      expect(parsed.success).toBe(false);
    });

    it("rejects an empty label", () => {
      const parsed = vendorPaymentConfigInputSchema.safeParse({
        kind: "pointer",
        label: "",
        url: "https://pay.example/kopitiam",
      });
      expect(parsed.success).toBe(false);
    });

    it("rejects an invalid url", () => {
      const parsed = vendorPaymentConfigInputSchema.safeParse({
        kind: "pointer",
        label: "Pay",
        url: "not-a-url",
      });
      expect(parsed.success).toBe(false);
    });
  });
});

describe("issueRefundInputSchema", () => {
  const VALID_TX_ID = "11111111-1111-1111-1111-111111111111";

  it("accepts a valid refund input and coerces the amount to a number", () => {
    const parsed = issueRefundInputSchema.safeParse({
      transaction_id: VALID_TX_ID,
      refunded_amount_cents: "450",
      reason: "damaged",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.refunded_amount_cents).toBe(450);
    }
  });

  it("accepts an omitted reason", () => {
    const parsed = issueRefundInputSchema.safeParse({
      transaction_id: VALID_TX_ID,
      refunded_amount_cents: "450",
      reason: "",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a non-UUID transaction id", () => {
    const parsed = issueRefundInputSchema.safeParse({
      transaction_id: "not-a-uuid",
      refunded_amount_cents: "450",
      reason: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a zero or negative amount", () => {
    const parsed = issueRefundInputSchema.safeParse({
      transaction_id: VALID_TX_ID,
      refunded_amount_cents: "0",
      reason: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a non-integer amount", () => {
    const parsed = issueRefundInputSchema.safeParse({
      transaction_id: VALID_TX_ID,
      refunded_amount_cents: "10.5",
      reason: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an amount above the Postgres int4 bound", () => {
    const parsed = issueRefundInputSchema.safeParse({
      transaction_id: VALID_TX_ID,
      refunded_amount_cents: "99999999999",
      reason: "",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("supportMessageSchema", () => {
  it("accepts a valid payment-category message", () => {
    const parsed = supportMessageSchema.safeParse({
      category: "payment",
      body: "My QR isn't generating.",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an empty body", () => {
    const parsed = supportMessageSchema.safeParse({
      category: "payment",
      body: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an unknown category", () => {
    const parsed = supportMessageSchema.safeParse({
      category: "not-a-real-category",
      body: "Help",
    });
    expect(parsed.success).toBe(false);
  });
});

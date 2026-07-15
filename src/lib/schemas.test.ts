import { describe, it, expect } from "vitest";
import {
  vendorPaymentConfigInputSchema,
  issueRefundInputSchema,
} from "./schemas";

describe("vendorPaymentConfigInputSchema", () => {
  it("accepts a valid UEN-only config", () => {
    const parsed = vendorPaymentConfigInputSchema.safeParse({
      payee_name: "Kopitiam Cart",
      uen: "53312345A",
      mobile: "",
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts a valid mobile-only config", () => {
    const parsed = vendorPaymentConfigInputSchema.safeParse({
      payee_name: "Kopitiam Cart",
      uen: "",
      mobile: "+6591234567",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects both uen and mobile set", () => {
    const parsed = vendorPaymentConfigInputSchema.safeParse({
      payee_name: "Kopitiam Cart",
      uen: "53312345A",
      mobile: "+6591234567",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects neither uen nor mobile set", () => {
    const parsed = vendorPaymentConfigInputSchema.safeParse({
      payee_name: "Kopitiam Cart",
      uen: "",
      mobile: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an invalid UEN format", () => {
    const parsed = vendorPaymentConfigInputSchema.safeParse({
      payee_name: "Kopitiam Cart",
      uen: "!!!",
      mobile: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an empty payee name", () => {
    const parsed = vendorPaymentConfigInputSchema.safeParse({
      payee_name: "",
      uen: "53312345A",
      mobile: "",
    });
    expect(parsed.success).toBe(false);
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

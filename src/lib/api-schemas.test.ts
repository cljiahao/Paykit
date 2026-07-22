import { describe, it, expect } from "vitest";
import {
  checkoutRequestSchema,
  checkoutResponseSchema,
  transactionStatusResponseSchema,
  vendorConfigResponseSchema,
  toStatusResponse,
} from "./api-schemas";

describe("checkoutRequestSchema", () => {
  it("accepts a valid request", () => {
    const parsed = checkoutRequestSchema.safeParse({
      vendor_id: "11111111-1111-1111-1111-111111111111",
      amount_cents: 450,
      order_ref: "A-001",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a non-uuid vendor_id", () => {
    expect(
      checkoutRequestSchema.safeParse({
        vendor_id: "not-a-uuid",
        amount_cents: 450,
        order_ref: "A-001",
      }).success,
    ).toBe(false);
  });

  it("rejects a non-positive amount", () => {
    expect(
      checkoutRequestSchema.safeParse({
        vendor_id: "11111111-1111-1111-1111-111111111111",
        amount_cents: 0,
        order_ref: "A-001",
      }).success,
    ).toBe(false);
  });

  it("rejects an empty order_ref", () => {
    expect(
      checkoutRequestSchema.safeParse({
        vendor_id: "11111111-1111-1111-1111-111111111111",
        amount_cents: 450,
        order_ref: "",
      }).success,
    ).toBe(false);
  });
});

describe("checkoutResponseSchema / transactionStatusResponseSchema / vendorConfigResponseSchema", () => {
  it("accept well-formed payloads", () => {
    expect(
      checkoutResponseSchema.safeParse({
        type: "qr",
        transaction_id: "11111111-1111-1111-1111-111111111111",
        payload: "00020101...6304ABCD",
      }).success,
    ).toBe(true);
    expect(
      transactionStatusResponseSchema.safeParse({
        transaction_id: "11111111-1111-1111-1111-111111111111",
        status: "pending",
        amount_cents: 450,
        order_ref: "A-001",
        kit_slug: "qkit",
        claimed_at: null,
        confirmed_at: null,
        created_at: "2026-07-15T00:00:00Z",
      }).success,
    ).toBe(true);
    expect(
      vendorConfigResponseSchema.safeParse({
        has_config: true,
        display_name: "Kopitiam Cart",
      }).success,
    ).toBe(true);
  });
});

describe("toStatusResponse", () => {
  it("maps a DB row to the wire shape", () => {
    const mapped = toStatusResponse({
      id: "tx1",
      status: "claimed",
      amount_cents: 450,
      order_ref: "A-001",
      kit_slug: "qkit",
      claimed_at: "2026-07-15T00:00:00Z",
      confirmed_at: null,
      created_at: "2026-07-15T00:00:00Z",
    });
    expect(mapped).toEqual({
      transaction_id: "tx1",
      status: "claimed",
      amount_cents: 450,
      order_ref: "A-001",
      kit_slug: "qkit",
      claimed_at: "2026-07-15T00:00:00Z",
      confirmed_at: null,
      created_at: "2026-07-15T00:00:00Z",
    });
  });
});

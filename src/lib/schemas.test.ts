import { describe, it, expect } from "vitest";
import { vendorPaymentConfigInputSchema } from "./schemas";

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

import { describe, it, expect } from "vitest";
import { paynowAdapter, autoVerify } from "./adapter";
import type { VendorPaymentConfig } from "@/lib/types";

const config: VendorPaymentConfig = {
  vendor_id: "11111111-1111-1111-1111-111111111111",
  uen: "53312345A",
  mobile: null,
  payee_name: "Kopitiam Cart",
  verification_method: "manual",
  plan: "free",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("paynowAdapter", () => {
  it("declares kind paynow", () => {
    expect(paynowAdapter.kind).toBe("paynow");
  });

  it("renders a QR checkout view from a UEN config", () => {
    const view = paynowAdapter.renderCheckout(config, {
      amountCents: 450,
      orderRef: "order-1",
    });
    expect(view.type).toBe("qr");
    expect(view.payload).toContain("SG.PAYNOW");
    expect(view.payload).toContain("53312345A");
  });

  it("renders a QR checkout view from a mobile config", () => {
    const view = paynowAdapter.renderCheckout(
      { ...config, uen: null, mobile: "+6591234567" },
      { amountCents: 100, orderRef: "order-2" },
    );
    expect(view.payload).toContain("+6591234567");
  });
});

describe("autoVerify", () => {
  it("throws — schema-reserved, not enabled in v1", () => {
    expect(() => autoVerify()).toThrow("auto-verify not enabled");
  });
});

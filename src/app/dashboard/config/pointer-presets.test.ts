import { describe, it, expect } from "vitest";
import {
  POINTER_PRESETS,
  POINTER_PRESET_ORDER,
  derivePointerPreset,
} from "./pointer-presets";

describe("POINTER_PRESETS", () => {
  it("has exactly the v1 shortlist, in order: stripe, hitpay, paylah, other", () => {
    expect(POINTER_PRESET_ORDER).toEqual([
      "stripe",
      "hitpay",
      "paylah",
      "other",
    ]);
    expect(Object.keys(POINTER_PRESETS).sort()).toEqual(
      ["hitpay", "other", "paylah", "stripe"].sort(),
    );
  });

  it("stripe's urlPattern matches a real Stripe Payment Link and rejects an unrelated URL", () => {
    const { urlPattern } = POINTER_PRESETS.stripe;
    expect(urlPattern!.test("https://buy.stripe.com/test_abc123")).toBe(true);
    expect(urlPattern!.test("https://hit-pay.com/abc123")).toBe(false);
    expect(urlPattern!.test("https://evil.com/buy.stripe.com/fake")).toBe(
      false,
    );
  });

  it("hitpay's urlPattern matches any hit-pay.com subdomain and rejects an unrelated URL", () => {
    const { urlPattern } = POINTER_PRESETS.hitpay;
    expect(urlPattern!.test("https://securepayment.hit-pay.com/abc123")).toBe(
      true,
    );
    expect(urlPattern!.test("https://hit-pay.com/pay/abc123")).toBe(true);
    expect(urlPattern!.test("https://buy.stripe.com/test_abc123")).toBe(false);
  });

  it("paylah has no urlPattern (QR-image-only preset)", () => {
    expect(POINTER_PRESETS.paylah.urlPattern).toBeUndefined();
  });

  it("other has no urlPattern and an empty labelSuggestion (never overwrites a vendor's label)", () => {
    expect(POINTER_PRESETS.other.urlPattern).toBeUndefined();
    expect(POINTER_PRESETS.other.labelSuggestion).toBe("");
  });
});

describe("derivePointerPreset", () => {
  it("derives stripe from a buy.stripe.com URL", () => {
    expect(
      derivePointerPreset({
        url: "https://buy.stripe.com/test_abc123",
        qr_image_url: null,
      }),
    ).toBe("stripe");
  });

  it("derives hitpay from a hit-pay.com URL", () => {
    expect(
      derivePointerPreset({
        url: "https://securepayment.hit-pay.com/abc123",
        qr_image_url: null,
      }),
    ).toBe("hitpay");
  });

  it("falls back to other for an unrelated URL", () => {
    expect(
      derivePointerPreset({
        url: "https://pay.example/kopitiam",
        qr_image_url: null,
      }),
    ).toBe("other");
  });

  it("falls back to other for a qr_image_url-only config (indistinguishable PayLah! QR)", () => {
    expect(
      derivePointerPreset({
        url: null,
        qr_image_url: "https://cdn.example/qr.webp",
      }),
    ).toBe("other");
  });
});

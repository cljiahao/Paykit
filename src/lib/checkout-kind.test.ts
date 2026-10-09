import { describe, it, expect } from "vitest";
import { checkoutKind } from "./checkout-kind";
import { buildPayNowPayload } from "./payments/paynow";
const make = (payeeName = "Vendor", mobile = false) =>
  buildPayNowPayload({
    ...(mobile ? { mobile: "+6591234567" } : { uen: "53312345A" }),
    payeeName,
    reference: "order1",
    amountCents: 450,
  });
describe("legacy checkout kind proof", () => {
  it.each([
    ["Vendor", false],
    ["咖啡", true],
  ] as const)("preserves canonical PayNow %s", (name, mobile) =>
    expect(
      checkoutKind({ qr_payload: make(name, mobile), amount_cents: 450 }),
    ).toBe("qr"),
  );
  it.each([
    "https://pay.example/image.png",
    "000201",
    "000201000201",
    make().slice(0, -1) + "X",
    make().slice(0, -8),
    "2699x",
  ])("does not guess malformed or ambiguous kind", (qr_payload) =>
    expect(checkoutKind({ qr_payload, amount_cents: 450 })).toBeNull(),
  );
  it("rejects stored amount mismatch", () =>
    expect(checkoutKind({ qr_payload: make(), amount_cents: 451 })).toBeNull());
  it.each(["qr", "link", "image"] as const)(
    "honors immutable explicit %s",
    (checkout_kind) =>
      expect(
        checkoutKind({
          checkout_kind,
          qr_payload: "stored",
          amount_cents: 450,
        }),
      ).toBe(checkout_kind),
  );
});

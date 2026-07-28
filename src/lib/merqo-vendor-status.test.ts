import { describe, it, expect } from "vitest";
import { resolveVendorStatus } from "./merqo-vendor-status";

const AUTH_USERS = [{ id: "u1", email: "vendor@business.sg" }];

describe("resolveVendorStatus", () => {
  it("is inactive when no auth user matches the email", () => {
    expect(resolveVendorStatus("nobody@business.sg", AUTH_USERS, [])).toEqual({
      active: false,
      plan: null,
    });
  });

  it("is inactive when the auth user has no vendor_payment_config row", () => {
    expect(resolveVendorStatus("vendor@business.sg", AUTH_USERS, [])).toEqual({
      active: false,
      plan: null,
    });
  });

  it("is active with the config's plan when a row exists", () => {
    expect(
      resolveVendorStatus("vendor@business.sg", AUTH_USERS, [
        { vendor_id: "u1", plan: "pro" },
      ]),
    ).toEqual({ active: true, plan: "pro" });
  });

  it("matches email case-insensitively", () => {
    expect(
      resolveVendorStatus("VENDOR@business.sg", AUTH_USERS, [
        { vendor_id: "u1", plan: "free" },
      ]),
    ).toEqual({ active: true, plan: "free" });
  });
});

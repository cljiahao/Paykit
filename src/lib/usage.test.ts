import { describe, it, expect } from "vitest";
import { freeTierExceeded, usagePercent } from "./usage";

describe("freeTierExceeded", () => {
  it("false for a free vendor under the cap", () => {
    expect(freeTierExceeded("free", 99)).toBe(false);
  });
  it("true for a free vendor at the cap", () => {
    expect(freeTierExceeded("free", 100)).toBe(true);
  });
  it("true for a free vendor over the cap", () => {
    expect(freeTierExceeded("free", 150)).toBe(true);
  });
  it("false for a pro vendor at any count", () => {
    expect(freeTierExceeded("pro", 100_000)).toBe(false);
  });
});

describe("usagePercent", () => {
  it("0 at zero usage", () => {
    expect(usagePercent(0)).toBe(0);
  });
  it("50 at half the default 100 cap", () => {
    expect(usagePercent(50)).toBe(50);
  });
  it("clamps to 100 when over cap", () => {
    expect(usagePercent(150)).toBe(100);
  });
  it("honors a custom cap", () => {
    expect(usagePercent(10, 20)).toBe(50);
  });
});

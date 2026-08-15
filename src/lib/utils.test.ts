import { describe, it, expect } from "vitest";
import { formatCents } from "./utils";

describe("formatCents", () => {
  it("formats whole dollars", () => {
    expect(formatCents(500)).toBe("$5.00");
  });

  it("formats an amount with cents", () => {
    expect(formatCents(450)).toBe("$4.50");
  });

  it("formats zero", () => {
    expect(formatCents(0)).toBe("$0.00");
  });
});

import { describe, it, expect } from "vitest";
import { dollarsToCents } from "./money";
describe("dollarsToCents", () => {
  it.each([
    ["12.34", 1234],
    ["0.29", 29],
    ["1.005", 100],
    ["-2.50", -250],
    ["", 0],
    [null, 0],
  ])("converts %s with the existing rounding contract", (raw, cents) => {
    expect(dollarsToCents(raw)).toBe(cents);
  });
  it.each(["bad", new File(["data"], "example.txt")])(
    "leaves invalid form values for boundary validation",
    (raw) => {
      expect(dollarsToCents(raw)).toBeNaN();
    },
  );
  it("leaves nonfinite values for schema validation", () => {
    expect(dollarsToCents("Infinity")).toBe(Infinity);
  });
});

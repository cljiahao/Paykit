import { describe, it, expect } from "vitest";
import {
  claimTransition,
  confirmTransition,
  unclaimTransition,
} from "./tx-state";

describe("claimTransition", () => {
  it("pending -> claimed (changed)", () => {
    expect(claimTransition("pending")).toEqual({
      status: "claimed",
      changed: true,
    });
  });
  it("claimed -> claimed (idempotent, unchanged)", () => {
    expect(claimTransition("claimed")).toEqual({
      status: "claimed",
      changed: false,
    });
  });
  it("confirmed -> confirmed (idempotent, unchanged — cannot un-confirm)", () => {
    expect(claimTransition("confirmed")).toEqual({
      status: "confirmed",
      changed: false,
    });
  });
});

describe("confirmTransition", () => {
  it("pending -> confirmed (changed)", () => {
    expect(confirmTransition("pending")).toEqual({
      status: "confirmed",
      changed: true,
    });
  });
  it("claimed -> confirmed (changed)", () => {
    expect(confirmTransition("claimed")).toEqual({
      status: "confirmed",
      changed: true,
    });
  });
  it("confirmed -> confirmed (idempotent, unchanged)", () => {
    expect(confirmTransition("confirmed")).toEqual({
      status: "confirmed",
      changed: false,
    });
  });
});

describe("unclaimTransition", () => {
  it("claimed -> pending (changed)", () => {
    expect(unclaimTransition("claimed")).toEqual({
      status: "pending",
      changed: true,
    });
  });
  it("pending -> pending (idempotent, unchanged)", () => {
    expect(unclaimTransition("pending")).toEqual({
      status: "pending",
      changed: false,
    });
  });
  it("confirmed -> confirmed (idempotent, unchanged — cannot un-confirm)", () => {
    expect(unclaimTransition("confirmed")).toEqual({
      status: "confirmed",
      changed: false,
    });
  });
});

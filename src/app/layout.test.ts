import { describe, it, expect, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Space_Grotesk: () => ({ variable: "--font-space-grotesk" }),
  Inter: () => ({ variable: "--font-inter" }),
  JetBrains_Mono: () => ({ variable: "--font-jetbrains-mono" }),
}));

const { metadata } = await import("./layout");

describe("root layout metadata", () => {
  it("sets the browser-tab title", () => {
    expect(metadata.title).toBe("paykit: PayNow payments");
  });
});

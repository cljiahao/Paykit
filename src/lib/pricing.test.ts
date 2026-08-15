import { describe, it, expect, vi } from "vitest";
import { getPricing, DEFAULT_PRICING } from "./pricing";

function supabaseStub(data: unknown) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: () => Promise.resolve({ data, error: null }),
        })),
      })),
    })),
  } as unknown as Parameters<typeof getPricing>[0];
}

describe("getPricing", () => {
  it("returns the pricing row when one exists", async () => {
    const supabase = supabaseStub({ monthly_cents: 499, currency: "SGD" });
    await expect(getPricing(supabase)).resolves.toEqual({
      monthly_cents: 499,
      currency: "SGD",
    });
  });

  it("queries the pricing table for id = 1", async () => {
    const supabase = supabaseStub({ monthly_cents: 499, currency: "SGD" });
    await getPricing(supabase);
    expect(supabase.from).toHaveBeenCalledWith("pricing");
  });

  it("falls back to DEFAULT_PRICING when the row can't be read", async () => {
    const supabase = supabaseStub(null);
    await expect(getPricing(supabase)).resolves.toEqual(DEFAULT_PRICING);
  });
});

import { describe, expect, it, vi } from "vitest";
import { clientIp, rateLimit } from "./rate-limit";

function hdrs(init: Record<string, string>): Headers {
  return new Headers(init);
}

describe("clientIp", () => {
  it("takes the first hop of x-forwarded-for", () => {
    expect(
      clientIp(hdrs({ "x-forwarded-for": "203.0.113.5, 70.41.3.18" })),
    ).toBe("203.0.113.5");
  });

  it("trims whitespace around the first hop", () => {
    expect(
      clientIp(hdrs({ "x-forwarded-for": "  203.0.113.5 , 70.41.3.18" })),
    ).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    expect(clientIp(hdrs({ "x-real-ip": "198.51.100.7" }))).toBe(
      "198.51.100.7",
    );
  });

  it("falls back to x-real-ip when x-forwarded-for is empty", () => {
    expect(
      clientIp(hdrs({ "x-forwarded-for": "", "x-real-ip": "198.51.100.7" })),
    ).toBe("198.51.100.7");
  });

  it("returns 'unknown' when neither header is present", () => {
    expect(clientIp(hdrs({}))).toBe("unknown");
  });
});

function supabaseStub(data: unknown, error: unknown = null) {
  return {
    rpc: vi.fn(() => Promise.resolve({ data, error })),
  } as unknown as Parameters<typeof rateLimit>[0];
}

describe("rateLimit", () => {
  it("calls check_rate_limit with the given key/limit/window", async () => {
    const supabase = supabaseStub(true);
    await rateLimit(supabase, "checkout:qkit:1.2.3.4", 60, 60);
    expect(supabase.rpc).toHaveBeenCalledWith("check_rate_limit", {
      p_key: "checkout:qkit:1.2.3.4",
      p_limit: 60,
      p_window_seconds: 60,
    });
  });

  it("returns true when the limiter allows the call", async () => {
    const supabase = supabaseStub(true);
    await expect(rateLimit(supabase, "k", 1, 1)).resolves.toBe(true);
  });

  it("returns false when the limiter denies the call", async () => {
    const supabase = supabaseStub(false);
    await expect(rateLimit(supabase, "k", 1, 1)).resolves.toBe(false);
  });

  it("fails open (returns true) when the limiter errors", async () => {
    const supabase = supabaseStub(null, { message: "connection reset" });
    await expect(rateLimit(supabase, "k", 1, 1)).resolves.toBe(true);
  });
});

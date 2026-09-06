import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  getUserMock,
  redirectMock,
  maybeSingleMock,
  createServerClientMock,
  requireCurrentLegalAcceptanceMock,
} = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  redirectMock: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  maybeSingleMock: vi.fn(),
  createServerClientMock: vi.fn(),
  requireCurrentLegalAcceptanceMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: createServerClientMock,
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/legal-gate", () => ({
  requireCurrentLegalAcceptance: requireCurrentLegalAcceptanceMock,
}));

import { getVendorSession, getVendorPlan } from "@/lib/vendor-session";

function fakeSupabase() {
  return {
    auth: { getUser: getUserMock },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }),
    }),
  };
}

beforeEach(() => {
  redirectMock.mockClear();
  getUserMock.mockReset();
  maybeSingleMock.mockReset();
  createServerClientMock.mockReset().mockResolvedValue(fakeSupabase());
  requireCurrentLegalAcceptanceMock.mockReset().mockResolvedValue(undefined);
});

describe("getVendorSession", () => {
  it("redirects to /login when there's no session", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    await expect(getVendorSession()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/login");
    expect(requireCurrentLegalAcceptanceMock).not.toHaveBeenCalled();
  });

  it("returns the session-scoped client and user on a valid session", async () => {
    const user = { id: "u1", email: "vendor@business.sg" };
    getUserMock.mockResolvedValue({ data: { user } });

    const result = await getVendorSession();

    expect(result.user).toEqual(user);
    expect(result.supabase).toBeTruthy();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("passes the signed-in vendor's email through the legal-acceptance gate", async () => {
    const user = { id: "u1", email: "vendor@business.sg" };
    getUserMock.mockResolvedValue({ data: { user } });

    await getVendorSession();

    expect(requireCurrentLegalAcceptanceMock).toHaveBeenCalledWith(
      "vendor@business.sg",
    );
  });

  it("bounces to /legal/accept when the gate redirects (stale acceptance)", async () => {
    const user = { id: "u1", email: "vendor@business.sg" };
    getUserMock.mockResolvedValue({ data: { user } });
    requireCurrentLegalAcceptanceMock.mockRejectedValue(
      new Error("NEXT_REDIRECT"),
    );

    await expect(getVendorSession()).rejects.toThrow("NEXT_REDIRECT");
  });
});

describe("getVendorPlan", () => {
  it("returns null when the vendor has no vendor_payment_config row yet", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    const supabase = await createServerClientMock();
    expect(await getVendorPlan(supabase, "v1")).toBeNull();
  });

  it("returns the vendor's plan when a config row exists", async () => {
    maybeSingleMock.mockResolvedValue({ data: { plan: "pro" }, error: null });
    const supabase = await createServerClientMock();
    expect(await getVendorPlan(supabase, "v1")).toEqual({ plan: "pro" });
  });
});

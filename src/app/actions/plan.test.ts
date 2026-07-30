import { describe, it, expect, vi, beforeEach } from "vitest";

const { getUserMock, rpcMock, schemaMock, createServerClientMock } = vi.hoisted(
  () => ({
    getUserMock: vi.fn(),
    rpcMock: vi.fn(),
    schemaMock: vi.fn(),
    createServerClientMock: vi.fn(),
  }),
);

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: createServerClientMock,
}));

beforeEach(() => {
  getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "v1" } } });
  rpcMock.mockReset().mockResolvedValue({ data: { id: "msg1" }, error: null });
  schemaMock.mockReset().mockReturnValue({ rpc: rpcMock });
  createServerClientMock.mockReset().mockResolvedValue({
    auth: { getUser: getUserMock },
    schema: schemaMock,
  });
});

describe("requestProUpgradeAction", () => {
  it("files a billing-category support message for the signed-in vendor", async () => {
    const { requestProUpgradeAction } = await import("./plan");
    const result = await requestProUpgradeAction();
    expect(result).toEqual({ success: true });
    expect(rpcMock).toHaveBeenCalledWith("submit_support_message", {
      p_kit_slug: "paykit",
      p_category: "billing",
      p_body: "Requesting an upgrade to the Pro plan.",
    });
  });

  it("returns an error without calling the RPC when there's no session", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { requestProUpgradeAction } = await import("./plan");
    const result = await requestProUpgradeAction();
    expect(result).toEqual({
      success: false,
      error: "Please sign in first",
    });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("surfaces a friendly error when the RPC fails", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: "connection reset" },
    });
    const { requestProUpgradeAction } = await import("./plan");
    const result = await requestProUpgradeAction();
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).not.toMatch(/connection reset/);
    }
  });
});

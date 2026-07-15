import { describe, it, expect, vi, beforeEach } from "vitest";

const { orderMock, rpcMock, createServerClientMock } = vi.hoisted(() => ({
  orderMock: vi.fn(),
  rpcMock: vi.fn(),
  createServerClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: createServerClientMock,
}));

beforeEach(() => {
  orderMock
    .mockReset()
    .mockResolvedValue({ data: [{ id: "tx1" }], error: null });
  rpcMock.mockReset().mockResolvedValue({ data: 7, error: null });
  createServerClientMock.mockReset().mockResolvedValue({
    from: () => ({
      select: () => ({ eq: () => ({ order: () => ({ limit: orderMock }) }) }),
    }),
    rpc: rpcMock,
  });
});

describe("listTransactions", () => {
  it("returns the vendor's transactions", async () => {
    const { listTransactions } = await import("./transactions");
    expect(await listTransactions("v1")).toEqual([{ id: "tx1" }]);
  });
});

describe("txCountThisMonth", () => {
  it("returns the RPC count", async () => {
    const { txCountThisMonth } = await import("./transactions");
    expect(await txCountThisMonth("v1")).toBe(7);
    expect(rpcMock).toHaveBeenCalledWith("tx_count_this_month", {
      p_vendor: "v1",
    });
  });
});

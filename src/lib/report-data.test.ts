import { beforeEach, expect, it, vi } from "vitest";
const { range, eq } = vi.hoisted(() => ({ range: vi.fn(), eq: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => ({
    from: () => ({ select: () => ({ eq }) }),
  }),
}));
import { listAllTransactions } from "./transactions";
import { listAllBookings } from "./bookings";
beforeEach(() => {
  range.mockReset().mockResolvedValue({ data: [], error: null });
  eq.mockReset().mockReturnValue({ order: () => ({ range }) });
});
it.each([listAllTransactions, listAllBookings])(
  "reads complete vendor reports beyond 1000 rows",
  async (load) => {
    range
      .mockResolvedValueOnce({
        data: Array.from({ length: 1000 }, (_, i) => ({ id: String(i) })),
        error: null,
      })
      .mockResolvedValueOnce({ data: [{ id: "1000" }], error: null });
    expect(await load("owner")).toHaveLength(1001);
    expect(eq).toHaveBeenCalledWith("vendor_id", "owner");
    expect(range.mock.calls).toEqual([
      [0, 999],
      [1000, 1999],
      [1001, 2000],
    ]);
  },
);
it.each([listAllTransactions, listAllBookings])(
  "fails a report instead of returning partial totals",
  async (load) => {
    range
      .mockResolvedValueOnce({ data: [{ id: "one" }], error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "offline" } });
    await expect(load("owner")).rejects.toThrow("complete query");
  },
);

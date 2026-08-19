import { describe, it, expect, vi, beforeEach } from "vitest";

const { orderMock, maybeSingleMock, createServerClientMock } = vi.hoisted(
  () => ({
    orderMock: vi.fn(),
    maybeSingleMock: vi.fn(),
    createServerClientMock: vi.fn(),
  }),
);

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: createServerClientMock,
}));

beforeEach(() => {
  orderMock
    .mockReset()
    .mockResolvedValue({ data: [{ id: "b1" }], error: null });
  maybeSingleMock
    .mockReset()
    .mockResolvedValue({ data: { id: "b1" }, error: null });
  createServerClientMock.mockReset().mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({ limit: orderMock }),
          eq: () => ({ maybeSingle: maybeSingleMock }),
        }),
      }),
    }),
  });
});

describe("listBookings", () => {
  it("returns the vendor's bookings", async () => {
    const { listBookings } = await import("./bookings");
    expect(await listBookings("v1")).toEqual([{ id: "b1" }]);
  });

  it("returns an empty array on a read error", async () => {
    orderMock.mockResolvedValue({
      data: null,
      error: { message: "connection reset" },
    });
    const { listBookings } = await import("./bookings");
    expect(await listBookings("v1")).toEqual([]);
  });
});

describe("getBooking", () => {
  it("returns the vendor's own booking by id", async () => {
    const { getBooking } = await import("./bookings");
    expect(await getBooking("v1", "b1")).toEqual({ id: "b1" });
  });

  it("returns null on a read error", async () => {
    maybeSingleMock.mockResolvedValue({
      data: null,
      error: { message: "connection reset" },
    });
    const { getBooking } = await import("./bookings");
    expect(await getBooking("v1", "b1")).toBeNull();
  });

  it("returns null when no matching booking exists", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    const { getBooking } = await import("./bookings");
    expect(await getBooking("v1", "missing")).toBeNull();
  });
});

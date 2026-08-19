// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import BookingsPage from "./page";
import type { Booking } from "@/lib/types";

const { getVendorSessionMock, listBookingsMock } = vi.hoisted(() => ({
  getVendorSessionMock: vi.fn(),
  listBookingsMock: vi.fn(),
}));

vi.mock("@/lib/vendor-session", () => ({
  getVendorSession: getVendorSessionMock,
}));
vi.mock("@/lib/bookings", () => ({ listBookings: listBookingsMock }));

const BOOKING: Booking = {
  id: "b1",
  vendor_id: "v1",
  customer_name: "Jane Tan",
  customer_phone: null,
  event_date: "2026-12-01",
  total_amount_cents: 100000,
  deposit_amount_cents: 30000,
  balance_amount_cents: 70000,
  balance_due_date: "2026-11-24",
  status: "pending_deposit",
  deposit_transaction_id: "tx-deposit",
  balance_transaction_id: null,
  created_at: "2026-08-20T00:00:00Z",
  updated_at: "2026-08-20T00:00:00Z",
};

beforeEach(() => {
  getVendorSessionMock
    .mockReset()
    .mockResolvedValue({ supabase: {}, user: { id: "v1" } });
  listBookingsMock.mockReset();
});

describe("BookingsPage", () => {
  it("shows the empty state with no bookings", async () => {
    listBookingsMock.mockResolvedValue([]);
    const jsx = await BookingsPage();
    render(jsx);
    expect(
      screen.getByRole("heading", { name: "Bookings" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/no bookings yet/i)).toBeInTheDocument();
  });

  it("renders the vendor's bookings and a New booking trigger", async () => {
    listBookingsMock.mockResolvedValue([BOOKING]);
    const jsx = await BookingsPage();
    render(jsx);
    expect(screen.getByText("Jane Tan")).toBeInTheDocument();
    expect(listBookingsMock).toHaveBeenCalledWith("v1");
    expect(
      screen.getByRole("button", { name: "New booking" }),
    ).toBeInTheDocument();
  });
});

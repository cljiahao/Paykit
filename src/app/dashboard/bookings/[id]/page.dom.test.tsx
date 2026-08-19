// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Booking, Transaction } from "@/lib/types";

const {
  getVendorSessionMock,
  getBookingMock,
  getTransactionMock,
  notFoundMock,
} = vi.hoisted(() => ({
  getVendorSessionMock: vi.fn(),
  getBookingMock: vi.fn(),
  getTransactionMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/vendor-session", () => ({
  getVendorSession: getVendorSessionMock,
}));
vi.mock("@/lib/bookings", () => ({ getBooking: getBookingMock }));
vi.mock("@/lib/transactions", () => ({ getTransaction: getTransactionMock }));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));

const BOOKING: Booking = {
  id: "b1",
  vendor_id: "v1",
  customer_name: "Jane Tan",
  customer_phone: "+6591234567",
  event_date: "2026-12-01",
  total_amount_cents: 100000,
  deposit_amount_cents: 30000,
  balance_amount_cents: 70000,
  balance_due_date: "2026-11-24",
  status: "deposit_paid",
  deposit_transaction_id: "tx-deposit",
  balance_transaction_id: null,
  created_at: "2026-08-20T00:00:00Z",
  updated_at: "2026-08-20T00:00:00Z",
};

const DEPOSIT_TX: Transaction = {
  id: "tx-deposit",
  vendor_id: "v1",
  kit_slug: "paykit",
  order_ref: "booking:b1:deposit",
  amount_cents: 30000,
  status: "confirmed",
  qr_payload: "0002...",
  claimed_at: "2026-08-20T00:01:00Z",
  confirmed_at: "2026-08-20T00:02:00Z",
  created_at: "2026-08-20T00:00:00Z",
};

beforeEach(() => {
  getVendorSessionMock
    .mockReset()
    .mockResolvedValue({ supabase: {}, user: { id: "v1" } });
  getBookingMock.mockReset();
  getTransactionMock.mockReset().mockResolvedValue(null);
  notFoundMock.mockClear();
});

describe("BookingDetailPage", () => {
  it("404s when the booking doesn't exist (or isn't this vendor's)", async () => {
    getBookingMock.mockResolvedValue(null);
    const { default: BookingDetailPage } = await import("./page");
    await expect(
      BookingDetailPage({ params: Promise.resolve({ id: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalled();
  });

  it("renders the booking's details and its deposit transaction", async () => {
    getBookingMock.mockResolvedValue(BOOKING);
    getTransactionMock.mockImplementation(
      async (_vendorId: string, id: string) =>
        id === "tx-deposit" ? DEPOSIT_TX : null,
    );
    const { default: BookingDetailPage } = await import("./page");
    const jsx = await BookingDetailPage({
      params: Promise.resolve({ id: "b1" }),
    });
    render(jsx);

    expect(
      screen.getByRole("heading", { name: "Jane Tan" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Deposit paid")).toBeInTheDocument();
    expect(screen.getByText("confirmed")).toBeInTheDocument();
    expect(screen.getByText("Not yet created.")).toBeInTheDocument();
  });

  it("offers Create balance checkout once the deposit exists and balance doesn't yet", async () => {
    getBookingMock.mockResolvedValue(BOOKING);
    const { default: BookingDetailPage } = await import("./page");
    const jsx = await BookingDetailPage({
      params: Promise.resolve({ id: "b1" }),
    });
    render(jsx);
    expect(
      screen.getByRole("button", { name: /create balance checkout/i }),
    ).toBeInTheDocument();
  });

  it("hides Create balance checkout once the balance checkout already exists", async () => {
    getBookingMock.mockResolvedValue({
      ...BOOKING,
      balance_transaction_id: "tx-balance",
    });
    const { default: BookingDetailPage } = await import("./page");
    const jsx = await BookingDetailPage({
      params: Promise.resolve({ id: "b1" }),
    });
    render(jsx);
    expect(
      screen.queryByRole("button", { name: /create balance checkout/i }),
    ).not.toBeInTheDocument();
  });

  it("hides both actions once the booking is cancelled", async () => {
    getBookingMock.mockResolvedValue({ ...BOOKING, status: "cancelled" });
    const { default: BookingDetailPage } = await import("./page");
    const jsx = await BookingDetailPage({
      params: Promise.resolve({ id: "b1" }),
    });
    render(jsx);
    expect(
      screen.queryByRole("button", { name: /create balance checkout/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel booking" }),
    ).not.toBeInTheDocument();
  });
});

// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Booking, Transaction } from "@/lib/types";

const { getVendorSessionMock, listTransactionsMock, listBookingsMock } =
  vi.hoisted(() => ({
    getVendorSessionMock: vi.fn(),
    listTransactionsMock: vi.fn(),
    listBookingsMock: vi.fn(),
  }));

vi.mock("@/lib/vendor-session", () => ({
  getVendorSession: getVendorSessionMock,
}));
vi.mock("@/lib/transactions", () => ({ listTransactions: listTransactionsMock }));
vi.mock("@/lib/bookings", () => ({ listBookings: listBookingsMock }));

const TX: Transaction = {
  id: "tx1",
  vendor_id: "v1",
  kit_slug: "paykit",
  order_ref: "booking:b1:deposit",
  amount_cents: 100000,
  status: "confirmed",
  qr_payload: "0002...",
  claimed_at: "2026-06-01T00:00:00Z",
  confirmed_at: "2026-06-01T00:01:00Z",
  created_at: "2026-06-01T00:00:00Z",
};

const BOOKING: Booking = {
  id: "b1",
  vendor_id: "v1",
  customer_name: "Jane Tan",
  customer_phone: null,
  event_date: "2026-12-25",
  total_amount_cents: 100000,
  deposit_amount_cents: 30000,
  balance_amount_cents: 70000,
  balance_due_date: "2026-12-18",
  status: "deposit_paid",
  deposit_transaction_id: "tx1",
  balance_transaction_id: null,
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
};

beforeEach(() => {
  getVendorSessionMock
    .mockReset()
    .mockResolvedValue({ supabase: {}, user: { id: "v1" } });
  listTransactionsMock.mockReset().mockResolvedValue([TX]);
  listBookingsMock.mockReset().mockResolvedValue([BOOKING]);
});

describe("EarningsReportPage", () => {
  it("renders the requested year's total, months, and per-booking lines", async () => {
    const { default: EarningsReportPage } = await import("./page");
    const jsx = await EarningsReportPage({
      searchParams: Promise.resolve({ year: "2026" }),
    });
    render(jsx);

    expect(screen.getByText("2026")).toBeInTheDocument();
    expect(screen.getByText("Jane Tan")).toBeInTheDocument();
    expect(screen.getByText("2026-12-25")).toBeInTheDocument();
    expect(screen.getAllByText("$1,000.00").length).toBeGreaterThan(0);
  });

  it("defaults to the current year when none is given", async () => {
    const { default: EarningsReportPage } = await import("./page");
    const jsx = await EarningsReportPage({ searchParams: Promise.resolve({}) });
    render(jsx);
    expect(
      screen.getByText(String(new Date().getUTCFullYear())),
    ).toBeInTheDocument();
  });

  it("hides the per-booking table when there are no lines for the year", async () => {
    listBookingsMock.mockResolvedValue([]);
    listTransactionsMock.mockResolvedValue([
      { ...TX, order_ref: "qkit-order:x", created_at: "2025-01-01T00:00:00Z" },
    ]);
    const { default: EarningsReportPage } = await import("./page");
    const jsx = await EarningsReportPage({
      searchParams: Promise.resolve({ year: "2026" }),
    });
    render(jsx);
    expect(screen.queryByText("Customer")).not.toBeInTheDocument();
  });
});

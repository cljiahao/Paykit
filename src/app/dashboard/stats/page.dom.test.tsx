// @vitest-environment jsdom
//
// StatsPage is an async Server Component, same pattern as
// layout.dom.test.tsx: await it directly and render the returned element
// tree with RTL. `RevenueChart` wraps recharts' `ResponsiveContainer`,
// which needs real layout to size itself — not something jsdom provides
// meaningfully — so it's stubbed here to keep this test focused on
// StatsPage's own job: the Free/Pro gate and wiring `listTransactions` +
// `aggregateRevenueByDay` into the chart's data prop.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import StatsPage from "./page";
import type { Transaction } from "@/lib/types";

const {
  getVendorSessionMock,
  getVendorPlanMock,
  listTransactionsMock,
  RevenueChartMock,
} = vi.hoisted(() => ({
  getVendorSessionMock: vi.fn(),
  getVendorPlanMock: vi.fn(),
  listTransactionsMock: vi.fn(),
  RevenueChartMock: vi.fn(() => <div data-testid="revenue-chart" />),
}));

vi.mock("@/lib/vendor-session", () => ({
  getVendorSession: getVendorSessionMock,
  getVendorPlan: getVendorPlanMock,
}));
vi.mock("@/lib/transactions", () => ({
  listTransactions: listTransactionsMock,
}));
vi.mock("./revenue-chart", () => ({ RevenueChart: RevenueChartMock }));

beforeEach(() => {
  getVendorSessionMock.mockReset().mockResolvedValue({
    supabase: {},
    user: { id: "v1" },
  });
  getVendorPlanMock.mockReset();
  listTransactionsMock.mockReset();
  RevenueChartMock.mockClear();
});

describe("StatsPage", () => {
  it("shows the Pro upsell and never fetches transactions for a Free vendor", async () => {
    getVendorPlanMock.mockResolvedValue({ plan: "free" });

    const jsx = await StatsPage();
    render(jsx);

    expect(screen.getByRole("heading", { name: "Stats" })).toBeInTheDocument();
    expect(screen.getByText(/pro feature/i)).toBeInTheDocument();
    expect(screen.queryByTestId("revenue-chart")).not.toBeInTheDocument();
    expect(listTransactionsMock).not.toHaveBeenCalled();
  });

  it("shows the Pro upsell when the vendor has no config yet", async () => {
    getVendorPlanMock.mockResolvedValue(null);

    const jsx = await StatsPage();
    render(jsx);

    expect(screen.getByText(/pro feature/i)).toBeInTheDocument();
  });

  it("aggregates confirmed revenue by day and renders the chart for a Pro vendor", async () => {
    getVendorPlanMock.mockResolvedValue({ plan: "pro" });
    const transactions: Transaction[] = [
      {
        id: "tx1",
        vendor_id: "v1",
        kit_slug: "qkit",
        order_ref: "A-001",
        amount_cents: 500,
        status: "confirmed",
        qr_payload: "0002...",
        claimed_at: "2026-07-15T00:01:00Z",
        confirmed_at: "2026-07-15T00:02:00Z",
        created_at: "2026-07-15T00:00:00Z",
      },
      {
        id: "tx2",
        vendor_id: "v1",
        kit_slug: "qkit",
        order_ref: "A-002",
        amount_cents: 300,
        status: "pending",
        qr_payload: "0002...",
        claimed_at: null,
        confirmed_at: null,
        created_at: "2026-07-15T00:05:00Z",
      },
    ];
    listTransactionsMock.mockResolvedValue(transactions);

    const jsx = await StatsPage();
    render(jsx);

    expect(screen.getByTestId("revenue-chart")).toBeInTheDocument();
    expect(listTransactionsMock).toHaveBeenCalledWith("v1");
    expect(RevenueChartMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [{ date: "2026-07-15", cents: 500, count: 1 }],
      }),
      undefined,
    );
  });
});

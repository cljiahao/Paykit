// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/admin", () => ({ requireAdmin: vi.fn(async () => ({})) }));
vi.mock("@/lib/admin-data", () => ({
  platformTotals: vi.fn(async () => ({
    vendors: 4,
    free_vendors: 2,
    pro_vendors: 2,
    transactions: 120,
    confirmed_transactions: 90,
    confirmed_volume_cents: 456700,
  })),
  recentActivity: vi.fn(async () => [
    {
      id: "t1",
      vendor_id: "v1",
      email: "kopitiam@example.com",
      kit_slug: "qkit",
      amount_cents: 500,
      status: "confirmed",
      created_at: "2026-07-10T00:00:00Z",
    },
    {
      id: "t2",
      vendor_id: "v2",
      email: "bakery@example.com",
      kit_slug: "loopkit",
      amount_cents: 900,
      status: "pending",
      created_at: "2026-07-11T00:00:00Z",
    },
  ]),
}));

import AdminOverviewPage from "./page";

describe("AdminOverviewPage", () => {
  it("renders platform totals and recent activity", async () => {
    render(await AdminOverviewPage());
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();
    expect(screen.getByText("kopitiam@example.com")).toBeInTheDocument();
    expect(screen.getByText("bakery@example.com")).toBeInTheDocument();
    expect(screen.getByText("qkit")).toBeInTheDocument();
  });

  it("shows an empty state when there is no activity yet", async () => {
    const { recentActivity } = await import("@/lib/admin-data");
    vi.mocked(recentActivity).mockResolvedValueOnce([]);
    render(await AdminOverviewPage());
    expect(screen.getByText("No activity yet.")).toBeInTheDocument();
  });
});

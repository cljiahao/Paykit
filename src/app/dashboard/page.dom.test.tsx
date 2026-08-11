// @vitest-environment jsdom
//
// DashboardPage is an async Server Component, same pattern as
// layout.dom.test.tsx: await it directly and render the returned element
// tree with RTL. Covers the empty-state prompt, the transaction count, and
// the Pro nudge threshold (`shouldNudgePro`) branches.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardPage from "./page";

const { getVendorSessionMock, getVendorPlanMock, txCountThisMonthMock } =
  vi.hoisted(() => ({
    getVendorSessionMock: vi.fn(),
    getVendorPlanMock: vi.fn(),
    txCountThisMonthMock: vi.fn(),
  }));

vi.mock("@/lib/vendor-session", () => ({
  getVendorSession: getVendorSessionMock,
  getVendorPlan: getVendorPlanMock,
}));
vi.mock("@/lib/transactions", () => ({
  txCountThisMonth: txCountThisMonthMock,
}));

beforeEach(() => {
  getVendorSessionMock.mockReset().mockResolvedValue({
    supabase: {},
    user: { id: "v1" },
  });
  getVendorPlanMock.mockReset();
  txCountThisMonthMock.mockReset();
});

describe("DashboardPage", () => {
  it("shows the setup prompt when the vendor has no payment config yet", async () => {
    getVendorPlanMock.mockResolvedValue(null);
    txCountThisMonthMock.mockResolvedValue(5);

    const jsx = await DashboardPage();
    render(jsx);

    expect(
      screen.getByText(/haven.t set up payments yet/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Set it up" })).toHaveAttribute(
      "href",
      "/dashboard/config",
    );
    expect(screen.getByText("5 transactions this month")).toBeInTheDocument();
  });

  it("hides the setup prompt once a config exists, and hides the nudge below threshold", async () => {
    getVendorPlanMock.mockResolvedValue({ plan: "free" });
    txCountThisMonthMock.mockResolvedValue(10);

    const jsx = await DashboardPage();
    render(jsx);

    expect(
      screen.queryByText(/haven.t set up payments yet/i),
    ).not.toBeInTheDocument();
    expect(screen.getByText("10 transactions this month")).toBeInTheDocument();
    expect(screen.queryByText(/doing real volume/i)).not.toBeInTheDocument();
  });

  it("shows the Pro nudge once a Free vendor crosses the usage threshold", async () => {
    getVendorPlanMock.mockResolvedValue({ plan: "free" });
    txCountThisMonthMock.mockResolvedValue(50);

    const jsx = await DashboardPage();
    render(jsx);

    expect(screen.getByText(/doing real volume/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pro" })).toHaveAttribute(
      "href",
      "/dashboard/plan",
    );
  });

  it("never shows the nudge for a Pro vendor, even above threshold", async () => {
    getVendorPlanMock.mockResolvedValue({ plan: "pro" });
    txCountThisMonthMock.mockResolvedValue(999);

    const jsx = await DashboardPage();
    render(jsx);

    expect(screen.getByText("999 transactions this month")).toBeInTheDocument();
    expect(screen.queryByText(/doing real volume/i)).not.toBeInTheDocument();
  });
});

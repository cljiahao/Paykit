// @vitest-environment jsdom
//
// DashboardPage is an async Server Component, same pattern as
// layout.dom.test.tsx: await it directly and render the returned element
// tree with RTL. Covers the empty-state prompt, the transaction count, the
// Pro nudge threshold (`shouldNudgePro`) branches, and the durable
// tour-seen stamp (see page.tsx's own comment, and tour-actions.ts's
// stampTourSeen/markTourSeen) firing exactly when it should.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardPage from "./page";

const {
  getVendorPlanMock,
  txCountThisMonthMock,
  maybeSingleMock,
  stampTourSeenMock,
} = vi.hoisted(() => ({
  getVendorPlanMock: vi.fn(),
  txCountThisMonthMock: vi.fn(),
  maybeSingleMock: vi.fn(),
  stampTourSeenMock: vi.fn(async () => {}),
}));

vi.mock("@/lib/vendor-session", () => ({
  getVendorSession: vi.fn(async () => ({
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: maybeSingleMock,
          }),
        }),
      }),
    },
    user: { id: "v1" },
  })),
  getVendorPlan: getVendorPlanMock,
}));
vi.mock("@/lib/transactions", () => ({
  txCountThisMonth: txCountThisMonthMock,
}));
vi.mock("@/lib/tour-prefs", () => ({
  stampTourSeen: stampTourSeenMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
  maybeSingleMock.mockResolvedValue({
    data: { tour_seen_at: "2026-01-01T00:00:00Z" },
  });
  getVendorPlanMock.mockResolvedValue({ plan: "free" });
  txCountThisMonthMock.mockResolvedValue(0);
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

  it("stamps tour_seen_at durably when the vendor hasn't seen the tour yet", async () => {
    maybeSingleMock.mockResolvedValue({ data: { tour_seen_at: null } });

    const jsx = await DashboardPage();
    render(jsx);

    expect(stampTourSeenMock).toHaveBeenCalledWith(expect.anything(), "v1");
  });

  it("stamps tour_seen_at when no vendor_prefs row exists yet", async () => {
    maybeSingleMock.mockResolvedValue({ data: null });

    const jsx = await DashboardPage();
    render(jsx);

    expect(stampTourSeenMock).toHaveBeenCalledWith(expect.anything(), "v1");
  });

  it("does not re-stamp once the tour has already been seen", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { tour_seen_at: "2026-01-01T00:00:00Z" },
    });

    const jsx = await DashboardPage();
    render(jsx);

    expect(stampTourSeenMock).not.toHaveBeenCalled();
  });
});

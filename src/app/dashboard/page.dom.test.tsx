// @vitest-environment jsdom
//
// DashboardPage is a plain async Server Component (no RSC-specific
// machinery), so it can be awaited directly and its returned element tree
// rendered via RTL, same as layout.dom.test.tsx does for DashboardLayout.
// This file's job: prove the durable tour-seen stamp (see page.tsx's own
// comment, and tour-actions.ts's stampTourSeen/markTourSeen) fires exactly
// when it should — once, only while unseen — and never when already seen.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import DashboardPage from "./page";

const mocks = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
  stampTourSeen: vi.fn(async () => {}),
}));

vi.mock("@/lib/vendor-session", () => ({
  getVendorSession: vi.fn(async () => ({
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: mocks.maybeSingle,
          }),
        }),
      }),
    },
    user: { id: "v1" },
  })),
  getVendorPlan: vi.fn(async () => ({ plan: "free" })),
}));
vi.mock("@/lib/transactions", () => ({
  txCountThisMonth: vi.fn(async () => 0),
}));
vi.mock("@/lib/tour-prefs", () => ({
  stampTourSeen: mocks.stampTourSeen,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DashboardPage", () => {
  it("stamps tour_seen_at durably when the vendor hasn't seen the tour yet", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { tour_seen_at: null } });

    const jsx = await DashboardPage();
    render(jsx);

    expect(mocks.stampTourSeen).toHaveBeenCalledWith(expect.anything(), "v1");
  });

  it("stamps tour_seen_at when no vendor_prefs row exists yet", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null });

    const jsx = await DashboardPage();
    render(jsx);

    expect(mocks.stampTourSeen).toHaveBeenCalledWith(expect.anything(), "v1");
  });

  it("does not re-stamp once the tour has already been seen", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: { tour_seen_at: "2026-01-01T00:00:00Z" },
    });

    const jsx = await DashboardPage();
    render(jsx);

    expect(mocks.stampTourSeen).not.toHaveBeenCalled();
  });
});

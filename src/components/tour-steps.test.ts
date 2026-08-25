import { describe, expect, it } from "vitest";

import { tourSteps } from "./tour-steps";

describe("tourSteps", () => {
  it("returns 8 steps on desktop, 3 on mobile", () => {
    expect(tourSteps(false)).toHaveLength(8);
    expect(tourSteps(true)).toHaveLength(3);
  });

  it("anchors every step to a data-tour selector", () => {
    for (const mode of [false, true]) {
      for (const step of tourSteps(mode)) {
        expect(step.element).toMatch(/^\[data-tour="[a-z-]+"\]$/);
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.description.length).toBeGreaterThan(0);
      }
    }
  });

  it("opens on the transaction-count stat and ends on the replay button in both modes", () => {
    for (const mode of [false, true]) {
      const steps = tourSteps(mode);
      expect(steps[0].element).toBe('[data-tour="tx-count"]');
      expect(steps[steps.length - 1].element).toBe('[data-tour="tour-replay"]');
    }
  });

  it("renders the real TransactionStatusBadge markup for the example, not a hand-copied color", () => {
    const description = tourSteps(false)[0].description;
    expect(description).toContain("bg-mint/15");
    expect(description).not.toContain('class="tour-example-pill"');
  });

  it("desktop spotlights each nav landmark; mobile spotlights the menu instead", () => {
    const desktop = tourSteps(false).map((s) => s.element);
    expect(desktop).toEqual([
      '[data-tour="tx-count"]',
      '[data-tour="nav-config"]',
      '[data-tour="nav-transactions"]',
      '[data-tour="nav-bookings"]',
      '[data-tour="nav-stats"]',
      '[data-tour="nav-earnings"]',
      '[data-tour="nav-account"]',
      '[data-tour="tour-replay"]',
    ]);

    const mobile = tourSteps(true).map((s) => s.element);
    expect(mobile).toContain('[data-tour="nav-menu"]');
    expect(mobile).not.toContain('[data-tour="nav-config"]');
  });

  it("covers Bookings and Earnings, both live nav items with no tour step until now", () => {
    const steps = tourSteps(false);
    const bookings = steps.find(
      (s) => s.element === '[data-tour="nav-bookings"]',
    );
    const earnings = steps.find(
      (s) => s.element === '[data-tour="nav-earnings"]',
    );
    expect(bookings?.description).toMatch(/deposit|balance/i);
    expect(earnings?.description).toMatch(/revenue|earnings|report/i);
  });
});

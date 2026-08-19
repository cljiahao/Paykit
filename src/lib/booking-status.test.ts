import { describe, it, expect } from "vitest";
import { balanceDueBadge } from "./booking-status";

const NOW = new Date("2026-08-20T12:00:00Z");

describe("balanceDueBadge", () => {
  it("returns null when the status isn't deposit_paid", () => {
    expect(balanceDueBadge("pending_deposit", "2026-08-25", NOW)).toBeNull();
    expect(balanceDueBadge("fully_paid", "2026-08-25", NOW)).toBeNull();
    expect(balanceDueBadge("cancelled", "2026-08-25", NOW)).toBeNull();
  });

  it("returns null when the balance isn't due for more than 14 days", () => {
    expect(balanceDueBadge("deposit_paid", "2026-09-10", NOW)).toBeNull();
  });

  it("returns a due-soon badge exactly at the 14-day boundary", () => {
    expect(balanceDueBadge("deposit_paid", "2026-09-03", NOW)).toEqual({
      label: "Balance due in 14 days",
      urgency: "due-soon",
    });
  });

  it("returns a due-soon badge with the singular day form", () => {
    expect(balanceDueBadge("deposit_paid", "2026-08-21", NOW)).toEqual({
      label: "Balance due in 1 day",
      urgency: "due-soon",
    });
  });

  it("returns 'due today' when the balance is due today", () => {
    expect(balanceDueBadge("deposit_paid", "2026-08-20", NOW)).toEqual({
      label: "Balance due today",
      urgency: "due-soon",
    });
  });

  it("returns an overdue badge for a past due date", () => {
    expect(balanceDueBadge("deposit_paid", "2026-08-17", NOW)).toEqual({
      label: "Balance overdue by 3 days",
      urgency: "overdue",
    });
  });

  it("uses the singular day form when overdue by exactly one day", () => {
    expect(balanceDueBadge("deposit_paid", "2026-08-19", NOW)).toEqual({
      label: "Balance overdue by 1 day",
      urgency: "overdue",
    });
  });

  it("ignores time-of-day — only the calendar date matters", () => {
    const lateInDay = new Date("2026-08-20T23:59:00Z");
    expect(balanceDueBadge("deposit_paid", "2026-08-20", lateInDay)).toEqual({
      label: "Balance due today",
      urgency: "due-soon",
    });
  });
});

import type { BookingStatus } from "@/lib/types";

export type BalanceDueBadge = {
  label: string;
  urgency: "overdue" | "due-soon";
};

const REMINDER_WINDOW_DAYS = 14;

function daysUntil(isoDate: string, now: Date): number {
  const target = new Date(`${isoDate}T00:00:00Z`);
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function dueSoonLabel(days: number): string {
  if (days === 0) return "Balance due today";
  return `Balance due in ${days} day${days === 1 ? "" : "s"}`;
}

/**
 * Dashboard-badge reminder (no push/notification infra exists in this
 * repo) — only ever shown once the deposit is paid and the balance isn't
 * yet, within a 14-day window of `balanceDueDate`, or past it.
 */
export function balanceDueBadge(
  status: BookingStatus,
  balanceDueDate: string,
  now: Date = new Date(),
): BalanceDueBadge | null {
  if (status !== "deposit_paid") return null;

  const days = daysUntil(balanceDueDate, now);
  if (days < 0) {
    const overdueBy = -days;
    return {
      label: `Balance overdue by ${overdueBy} day${overdueBy === 1 ? "" : "s"}`,
      urgency: "overdue",
    };
  }
  if (days > REMINDER_WINDOW_DAYS) return null;
  return { label: dueSoonLabel(days), urgency: "due-soon" };
}

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { balanceDueBadge } from "@/lib/booking-status";
import type { Booking, BookingStatus } from "@/lib/types";

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending_deposit: "Pending deposit",
  deposit_paid: "Deposit paid",
  fully_paid: "Fully paid",
  cancelled: "Cancelled",
};

const STATUS_BADGE_CLASS: Partial<Record<BookingStatus, string>> = {
  deposit_paid: "bg-mint/15 text-mint ring-1 ring-mint/30",
  fully_paid: "bg-primary/15 text-primary ring-1 ring-primary/30",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge
      variant={status === "cancelled" ? "outline" : "secondary"}
      className={cn(STATUS_BADGE_CLASS[status])}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}

/**
 * Dashboard-badge-only reminder — this repo has no cron/notification infra
 * (see `AGENTS.md`), so this is the whole V1 "reminder": a visible pill once
 * the balance is within 14 days of `balance_due_date`, or overdue.
 */
export function BalanceDueIndicator({
  booking,
  now,
}: {
  booking: Pick<Booking, "status" | "balance_due_date">;
  now?: Date;
}) {
  const badge = balanceDueBadge(booking.status, booking.balance_due_date, now);
  if (!badge) return null;
  return (
    <Badge
      variant="outline"
      className={cn(
        badge.urgency === "overdue"
          ? "border-destructive/40 text-destructive"
          : "border-amber-500/40 text-amber-600 dark:text-amber-500",
      )}
    >
      {badge.label}
    </Badge>
  );
}

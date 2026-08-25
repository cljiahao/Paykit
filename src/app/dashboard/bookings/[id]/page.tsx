import { notFound } from "next/navigation";
import { getVendorSession } from "@/lib/vendor-session";
import { getBooking } from "@/lib/bookings";
import { getTransaction } from "@/lib/transactions";
import { formatCents, formatDate } from "@/lib/utils";
import { BookingStatusBadge, BalanceDueIndicator } from "../booking-badges";
import { TransactionStatusCard } from "./transaction-status-card";
import { CreateBalanceCheckoutButton } from "./create-balance-checkout-button";
import { CancelBookingDialog } from "./cancel-booking-dialog";
import { RescheduleBookingDialog } from "./reschedule-booking-dialog";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user } = await getVendorSession();
  const booking = await getBooking(user.id, id);
  if (!booking) notFound();

  const [depositTx, balanceTx] = await Promise.all([
    booking.deposit_transaction_id
      ? getTransaction(user.id, booking.deposit_transaction_id)
      : Promise.resolve(null),
    booking.balance_transaction_id
      ? getTransaction(user.id, booking.balance_transaction_id)
      : Promise.resolve(null),
  ]);

  const canCreateBalanceCheckout =
    booking.status !== "cancelled" &&
    Boolean(booking.deposit_transaction_id) &&
    !booking.balance_transaction_id;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {booking.customer_name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Event on {formatDate(booking.event_date)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <BookingStatusBadge status={booking.status} />
          <BalanceDueIndicator booking={booking} />
        </div>
      </div>

      <div className="rounded-xl border p-4 text-sm">
        <dl className="grid grid-cols-2 gap-y-2">
          <dt className="text-muted-foreground">Customer phone</dt>
          <dd>{booking.customer_phone ?? "—"}</dd>
          <dt className="text-muted-foreground">Total</dt>
          <dd>{formatCents(booking.total_amount_cents)}</dd>
          <dt className="text-muted-foreground">Deposit</dt>
          <dd>{formatCents(booking.deposit_amount_cents)}</dd>
          <dt className="text-muted-foreground">Balance</dt>
          <dd>{formatCents(booking.balance_amount_cents)}</dd>
          <dt className="text-muted-foreground">Balance due</dt>
          <dd>{formatDate(booking.balance_due_date)}</dd>
        </dl>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TransactionStatusCard label="Deposit" transaction={depositTx} />
        <TransactionStatusCard label="Balance" transaction={balanceTx} />
      </div>

      {booking.status !== "cancelled" && (
        <div className="flex flex-wrap items-center gap-3">
          {canCreateBalanceCheckout && (
            <CreateBalanceCheckoutButton bookingId={booking.id} />
          )}
          <RescheduleBookingDialog
            bookingId={booking.id}
            eventDate={booking.event_date}
            balanceDueDate={booking.balance_due_date}
          />
          <CancelBookingDialog
            bookingId={booking.id}
            depositTx={depositTx}
            balanceTx={balanceTx}
          />
        </div>
      )}
    </div>
  );
}

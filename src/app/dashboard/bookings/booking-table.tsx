import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCents, formatDate } from "@/lib/utils";
import { BookingStatusBadge, BalanceDueIndicator } from "./booking-badges";
import type { Booking } from "@/lib/types";

export function BookingTable({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return <p className="text-sm text-muted-foreground">No bookings yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Event date</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Balance due</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell>
              <Link
                href={`/dashboard/bookings/${booking.id}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {booking.customer_name}
              </Link>
            </TableCell>
            <TableCell>{formatDate(booking.event_date)}</TableCell>
            <TableCell>{formatCents(booking.total_amount_cents)}</TableCell>
            <TableCell>
              <BookingStatusBadge status={booking.status} />
            </TableCell>
            <TableCell>
              <BalanceDueIndicator booking={booking} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

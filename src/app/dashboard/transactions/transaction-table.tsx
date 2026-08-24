import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCents } from "@/lib/utils";
import { RefundDialog } from "./refund-dialog";
import { TransactionStatusBadge } from "./transaction-status-badge";
import type { Transaction } from "@/lib/types";

export function TransactionTable({
  transactions,
  isPro,
}: {
  transactions: Transaction[];
  isPro: boolean;
}) {
  if (transactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No transactions yet.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kit</TableHead>
          <TableHead>Order ref</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          {isPro && <TableHead>Refund</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => (
          <TableRow key={tx.id}>
            <TableCell>{tx.kit_slug}</TableCell>
            <TableCell>{tx.order_ref}</TableCell>
            <TableCell>{formatCents(tx.amount_cents)}</TableCell>
            <TableCell>
              <TransactionStatusBadge status={tx.status} />
            </TableCell>
            <TableCell>
              {new Date(tx.created_at).toLocaleDateString("en-SG")}
            </TableCell>
            {isPro && (
              <TableCell>
                {tx.status === "confirmed" && (
                  <RefundDialog transactionId={tx.id} />
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn, formatCents } from "@/lib/utils";
import { RefundDialog } from "./refund-dialog";
import type { Transaction, TxStatus } from "@/lib/types";

// `claimed` — the customer says they've paid, waiting on the vendor to
// confirm — is the one status that actually needs the vendor's attention
// right now, so it gets the brand mint accent instead of shadcn's Badge
// `default`/`secondary` pair (which otherwise reduces the 3-state
// pending→claimed→confirmed machine, `@/lib/tx-state`, to 2 visual states).
const STATUS_BADGE_CLASS: Partial<Record<TxStatus, string>> = {
  claimed: "bg-mint/15 text-mint ring-1 ring-mint/30",
};

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
              <Badge
                variant={tx.status === "confirmed" ? "default" : "secondary"}
                className={cn(STATUS_BADGE_CLASS[tx.status])}
              >
                {tx.status}
              </Badge>
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

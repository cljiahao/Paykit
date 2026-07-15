import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/lib/types";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
  }).format(cents / 100);
}

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
              >
                {tx.status}
              </Badge>
            </TableCell>
            <TableCell>
              {new Date(tx.created_at).toLocaleDateString("en-SG")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

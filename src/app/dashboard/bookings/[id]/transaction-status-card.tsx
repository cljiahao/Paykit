import { Badge } from "@/components/ui/badge";
import { cn, formatCents } from "@/lib/utils";
import { QrCodeView } from "./qr-code-view";
import type { Transaction, TxStatus } from "@/lib/types";

// Same treatment as `dashboard/transactions/transaction-table.tsx` — `claimed`
// is the one status that actually needs the vendor's attention right now.
const STATUS_BADGE_CLASS: Partial<Record<TxStatus, string>> = {
  claimed: "bg-mint/15 text-mint ring-1 ring-mint/30",
};

export function TransactionStatusCard({
  label,
  transaction,
}: {
  label: string;
  transaction: Transaction | null;
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {!transaction ? (
        <p className="mt-2 text-sm text-muted-foreground">Not yet created.</p>
      ) : (
        <>
          <div className="mt-2 flex items-center gap-2">
            <Badge
              variant={
                transaction.status === "confirmed" ? "default" : "secondary"
              }
              className={cn(STATUS_BADGE_CLASS[transaction.status])}
            >
              {transaction.status}
            </Badge>
            <span className="text-sm font-medium">
              {formatCents(transaction.amount_cents)}
            </span>
          </div>
          <div className="mt-3">
            <QrCodeView value={transaction.qr_payload} />
          </div>
        </>
      )}
    </div>
  );
}

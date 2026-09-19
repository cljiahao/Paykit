import { Badge } from "@/components/ui/badge";
import { cn, formatCents } from "@/lib/utils";
import type { Transaction, TxStatus } from "@/lib/types";

// Same treatment as `dashboard/transactions/transaction-table.tsx` — `claimed`
// is the one status that actually needs the vendor's attention right now.
const STATUS_BADGE_CLASS: Partial<Record<TxStatus, string>> = {
  claimed: "bg-mint/15 text-mint ring-1 ring-mint/30",
};

// `qrMarkup` is rendered by the (server) page via @merqo/ui's `qrSvg` and
// passed down as a plain string, rather than generated here: `qrSvg` is
// async, and an async child cannot be rendered by this page's jsdom test.
export function TransactionStatusCard({
  label,
  transaction,
  qrMarkup,
}: {
  label: string;
  transaction: Transaction | null;
  qrMarkup: string | null;
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
          <div
            className="mt-3 w-40 [&_svg]:h-auto [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qrMarkup ?? "" }}
          />
        </>
      )}
    </div>
  );
}

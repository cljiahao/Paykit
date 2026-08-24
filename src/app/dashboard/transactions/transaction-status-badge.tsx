import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TxStatus } from "@/lib/types";

// `claimed` gets the brand mint accent instead of shadcn's Badge
// `default`/`secondary` pair, since it's the one status needing the
// vendor's attention right now (pending→claimed→confirmed, `@/lib/tx-state`).
const STATUS_BADGE_CLASS: Partial<Record<TxStatus, string>> = {
  claimed: "bg-mint/15 text-mint ring-1 ring-mint/30",
};

export function TransactionStatusBadge({ status }: { status: TxStatus }) {
  return (
    <Badge
      variant={status === "confirmed" ? "default" : "secondary"}
      className={cn(STATUS_BADGE_CLASS[status])}
    >
      {status}
    </Badge>
  );
}

import { StatusBadge } from "@merqo/ui";
import type { TxStatus } from "@/lib/types";

// `claimed` keeps the brand mint accent — it's the one status needing the
// vendor's attention right now (pending→claimed→confirmed, `@/lib/tx-state`).
const STATUS_CONFIG: Record<TxStatus, { label: string; className: string }> = {
  pending: {
    label: "pending",
    className: "text-secondary border-secondary/35 bg-secondary/12",
  },
  claimed: {
    label: "claimed",
    className: "text-mint border-mint/35 bg-mint/12",
  },
  confirmed: {
    label: "confirmed",
    className: "text-primary border-primary/35 bg-primary/12",
  },
};

export function TransactionStatusBadge({ status }: { status: TxStatus }) {
  return <StatusBadge status={status} config={STATUS_CONFIG} />;
}

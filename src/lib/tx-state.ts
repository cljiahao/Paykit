import type { TxStatus } from "@/lib/types";

export type { TxStatus };

/** Customer tapped "I've paid". Idempotent: already claimed/confirmed is a no-op success, never reverts a confirmed payment. */
export function claimTransition(current: TxStatus): {
  status: TxStatus;
  changed: boolean;
} {
  if (current === "pending") return { status: "claimed", changed: true };
  return { status: current, changed: false };
}

/** Vendor confirmed receipt. Idempotent: already confirmed is a no-op success. */
export function confirmTransition(current: TxStatus): {
  status: TxStatus;
  changed: boolean;
} {
  if (current === "pending" || current === "claimed")
    return { status: "confirmed", changed: true };
  return { status: "confirmed", changed: false };
}

/** Customer undoes an accidental "I've paid" tap. Idempotent: only reverts a `claimed` transaction back to `pending`; a `confirmed` transaction is always a no-op — this is what makes it impossible to un-confirm a real payment. */
export function unclaimTransition(current: TxStatus): {
  status: TxStatus;
  changed: boolean;
} {
  if (current === "claimed") return { status: "pending", changed: true };
  return { status: current, changed: false };
}

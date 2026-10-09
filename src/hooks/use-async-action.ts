"use client";

import { useAsyncAction as useSharedAsyncAction } from "@merqo/ui";

/** Runs a per-call handler with independent pending/error state and resets pending on rejection. */
export function useAsyncAction(): {
  pending: boolean;
  error: unknown;
  run: (fn: () => Promise<void>) => Promise<void>;
  reset: () => void;
} {
  return useSharedAsyncAction((fn: () => Promise<void>) => fn());
}

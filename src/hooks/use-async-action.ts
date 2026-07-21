import { useState, useCallback } from "react";

/**
 * A `pending` flag for an async handler that ALWAYS resets — even if the
 * handler throws (a server action rejecting on a network error). Replaces a
 * hand-rolled `setBusy(true) … await … setBusy(false)` pattern, which leaves
 * the button stuck-disabled on a throw (the reset never runs).
 *
 *   const { pending, run } = useAsyncAction();
 *   <Button disabled={pending} onClick={() => run(async () => { … })} />
 */
export function useAsyncAction(): {
  pending: boolean;
  run: (fn: () => Promise<void>) => Promise<void>;
} {
  const [pending, setPending] = useState(false);
  const run = useCallback(async (fn: () => Promise<void>) => {
    setPending(true);
    try {
      await fn();
    } finally {
      setPending(false);
    }
  }, []);
  return { pending, run };
}

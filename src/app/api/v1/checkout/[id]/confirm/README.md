# `POST /api/v1/checkout/{id}/confirm`

Moves a `pending` or `claimed` transaction to `confirmed` — the vendor
confirmed receipt. Bearer-secret (`verifyKitAuth`), path-param UUID
validation, and a guarded update (`WHERE status IN ('pending', 'claimed')`)
with a recheck-and-return-current-state fallback if a concurrent request
already changed it — never a 4xx/5xx just because two requests raced.

Idempotent: an already-`confirmed` transaction is a no-op, echoing the
current status back. Once `confirmed`, a transaction never transitions
again (see the sibling `unclaim` route's own note on this).

A real (non-idempotent) confirm writes a `confirmed` `payment_audit` row
(`@/lib/payment-audit`). Rate-limited (`@/lib/rate-limit`, 60/60s per
`kit_slug`+IP) right after auth.

Response shape is the shared `TransactionStatusResponse`
(`src/lib/api-schemas.ts`'s `toStatusResponse`).

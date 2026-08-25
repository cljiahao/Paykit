# `POST /api/v1/checkout/{id}/claim`

Moves a `pending` transaction to `claimed` — the customer tapped "I've
paid." Bearer-secret (`verifyKitAuth`), path-param UUID validation, and a
guarded update (`WHERE status = 'pending'`) with a recheck-and-return-
current-state fallback if a concurrent request already changed it — never
a 4xx/5xx just because two requests raced.

Idempotent: already-`claimed`/`confirmed` is a no-op, echoing the current
status back.

A real (non-idempotent) claim writes a `claimed` `payment_audit` row
(`@/lib/payment-audit`).

Response shape is the shared `TransactionStatusResponse`
(`src/lib/api-schemas.ts`'s `toStatusResponse`).

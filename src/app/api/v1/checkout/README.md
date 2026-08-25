# checkout

## Purpose

`POST /api/v1/checkout` — a calling kit requests a checkout QR/payment
pointer for a vendor's transaction. Bearer-secret authenticated
(`verifyKitAuth`).

## Contents

- `route.ts` — `POST`: validates the request body against
  `checkoutRequestSchema`, verifies the caller's bearer secret, then calls
  `@/lib/checkout`'s `createCheckout()` — the shared insert-a-`transactions`-
  row-and-render-the-checkout-view path (PayNow QR or BYO pointer, via
  `getProvider().createCheckout(...)`, see `src/lib/payments/README.md` for
  the provider seam itself), also used directly by the dashboard's own
  booking deposit/balance actions (`dashboard/bookings/actions.ts`), which
  don't go through this HTTP route. Idempotent on `(kit_slug, order_ref)` —
  a retried call with the same pair (Postgres unique-constraint violation
  on insert) reads back and returns the existing transaction instead of
  creating a duplicate or failing.
- `route.test.ts` — covers a fresh checkout, the idempotent-retry path
  (same `(kit_slug, order_ref)` returns the same transaction, no duplicate
  row), and the 503 case where the idempotent re-read itself fails.
- `[id]/` — sub-routes for claiming/unclaiming/confirming a specific
  transaction. `claim` moves `pending`→`claimed` (customer tapped "I've
  paid"); `unclaim` reverts `claimed`→`pending` (undoes an accidental tap) —
  it is always a no-op on an already-`confirmed` transaction, so a real
  payment can never be un-confirmed; `confirm` moves to `confirmed`
  (vendor confirmed receipt). Every real transition here (including this
  route's own `checkout_created`) writes a `payment_audit` row via
  `@/lib/payment-audit`'s `recordPaymentAudit` — a no-op/idempotent request
  writes nothing, see `src/lib/README.md`. Every route here (this one
  included) is also rate-limited (`@/lib/rate-limit`, 60 requests/60s per
  `kit_slug`+IP) right after auth, before any DB read.

## Parent

[v1](../README.md)

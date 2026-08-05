# checkout

## Purpose

`POST /api/v1/checkout` — a calling kit requests a checkout QR/payment
pointer for a vendor's transaction. Bearer-secret authenticated
(`verifyKitAuth`).

## Contents

- `route.ts` — `POST`: validates the request body against
  `checkoutRequestSchema`, verifies the caller's bearer secret, then inserts
  a `transactions` row (service-role client) and renders the checkout
  (PayNow QR or BYO pointer) via `renderCheckout`. Idempotent on
  `(kit_slug, order_ref)` — a retried call with the same pair (Postgres
  unique-constraint violation on insert) reads back and returns the
  existing transaction instead of creating a duplicate or failing.
- `route.test.ts` — covers a fresh checkout, the idempotent-retry path
  (same `(kit_slug, order_ref)` returns the same transaction, no duplicate
  row), and the 503 case where the idempotent re-read itself fails.
- `[id]/` — sub-routes for claiming/confirming a specific transaction.

## Parent

[v1](../README.md)

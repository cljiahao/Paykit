# [booking_id]

## Purpose

`GET /api/v1/bookings/{booking_id}` — a calling kit reads one booking's live
deposit/balance status (e.g. qkit showing paykit's booking status inline on
its own booth dashboard). Bearer-secret authenticated (`verifyKitAuth`),
service-role. Read-only — never touches funds, never verifies a payment,
just reports the same status `sync_booking_status()` already keeps correct.
Same trust model as every other `/api/v1/*` route: the calling kit is
trusted server-to-server via its bearer secret, not asked to prove which
vendor owns the booking.

## Contents

- `route.ts` — `GET`: reads `paykit.bookings` by id, then looks up its
  linked `deposit_transaction_id`/`balance_transaction_id` (when set) to
  report whether each is `confirmed`. Returns `{ booking_id, status,
event_date, deposit_amount_cents, balance_amount_cents,
total_amount_cents, deposit_confirmed, balance_confirmed }`; 404 when the
  booking doesn't exist, 503 on a DB read failure.
- `route.test.ts` — covers auth/validation/not-found/upstream-failure paths
  and both confirmed-flag combinations (present-and-confirmed,
  present-and-not-confirmed, not-yet-created).

## Parent

[bookings](../../README.md)

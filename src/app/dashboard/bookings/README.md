# bookings

## Purpose

Deposit-now, balance-later bookings for event-cart vendors (weddings,
private events) — instead of paykit's usual one-shot checkout. A booking
links up to two `transactions` rows (deposit, then later balance) by id;
`bookings.status` tracks itself off those transactions' own `confirmed`
state via a DB trigger (`sync_booking_status()`,
`supabase/migrations/0010_paykit_bookings.sql`), not app code, so it stays
correct regardless of which path confirmed a payment (dashboard or the
bearer-secret `/api/v1/checkout/{id}/confirm` API).

Reminders are dashboard-badge-only this round: this repo has no cron or
push-notification infra (see `AGENTS.md`), so "balance due soon" is a
pill computed at render time (`@/lib/booking-status`'s `balanceDueBadge`),
not a push. Rescheduling (deposit-carries-forward), widening refunds onto
a cancelled booking, and any OCR/earnings-report tie-in are explicitly out
of scope — see the product roadmap doc's own tiering.

## Contents

- `actions.ts` — `createBookingAction` (Zod-validates via
  `createBookingInputSchema`, inserts the `bookings` row, then calls
  `@/lib/checkout`'s `createCheckout` for the deposit — `kitSlug: "paykit"`,
  `order_ref: booking:<id>:deposit` — and links the resulting
  `transaction_id` back via the service-role client, since
  `deposit_transaction_id` is excluded from the vendor's own column-scoped
  grant; deletes the booking row again if the checkout itself fails, since
  there's no separate "retry deposit checkout" action). `createBalanceCheckoutAction(bookingId)`
  — same shape for the balance leg (`order_ref: booking:<id>:balance`),
  only when a deposit checkout exists and a balance one doesn't yet.
  `cancelBookingAction(bookingId, reason?)` — sets `status = 'cancelled'`
  only (never touches either linked transaction's own status — a cancelled
  booking doesn't retroactively unclaim/unconfirm a payment that already
  happened) and records the reason via `recordAudit()` (`app/admin/
actions.ts`) since `bookings` itself has no reason column.
- `actions.test.ts` — unit coverage for all three actions, including the
  deposit-checkout-failure compensating delete and every ownership/guard
  branch (malformed id, missing deposit, balance already created).
- `page.tsx` — `BookingsPage()` (server): `listBookings(vendorId)` +
  `BookingTable` + `NewBookingDialog`.
- `page.dom.test.tsx` — awaits the async server component directly (same
  pattern as `transactions/page.dom.test.tsx`).
- `booking-table.tsx` — one row per booking: customer (links to the detail
  page), event date, total, `BookingStatusBadge`, `BalanceDueIndicator`.
  Plain (non-`"use client"`) — same instinct as `transaction-table.tsx`.
- `booking-table.dom.test.tsx` — row rendering, empty state, the balance-due
  badge appearing for a `deposit_paid` booking due soon (computed relative
  to the real clock at test time, not a hardcoded date, so it can't rot).
- `booking-badges.tsx` — `BookingStatusBadge`/`BalanceDueIndicator`, thin
  presentational wrappers around `@/lib/booking-status`'s pure
  `balanceDueBadge` plus a `BookingStatus` -> label/class lookup, shared by
  the list table and the detail page.
- `new-booking-dialog.tsx` — creation form (same Dialog + `useActionState`
  shape as `transactions/refund-dialog.tsx`): customer name/phone, event
  date, balance due date, and total/deposit/balance dollar amounts. The
  balance field auto-derives from total − deposit until the vendor edits it
  directly (`balanceTouched`, same "touched" instinct as `config/payment-
config-form.tsx`'s label-preset wiring) — the deposit+balance-must-equal-
  total check still runs server-side regardless.
- `new-booking-dialog.dom.test.tsx` — open/submit/close-on-success, the
  balance auto-derivation and its touched-lock, and the inline error path.
- `[id]/` — the per-booking detail page: both linked transactions'
  status/QR, "Create balance checkout" once eligible, and cancel (own
  README).

## Connectivity

Reachable from `dashboard-nav.tsx`'s "Bookings" link. Both dialogs/buttons
call into `actions.ts`, which calls `@/lib/checkout`'s `createCheckout` (the
same function `POST /api/v1/checkout` uses) and `@/lib/bookings`/`@/lib/
transactions` for reads.

## Parent

[dashboard](../README.md)

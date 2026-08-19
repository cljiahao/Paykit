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
- `[id]/page.tsx` — `BookingDetailPage({params})` (server, Next 16 async
  `params`): `notFound()`s on a missing/not-owned booking (RLS already
  filters `getBooking` to this vendor; a wrong id just reads back `null`),
  then renders the booking's fields, both linked transactions via
  `TransactionStatusCard`, `CreateBalanceCheckoutButton` (only once
  eligible), and `CancelBookingDialog` — both hidden once the booking is
  already `cancelled`.
- `[id]/page.dom.test.tsx` — 404 path, field rendering, and every
  action-visibility branch (balance-checkout eligibility, cancelled hides
  both actions).
- `[id]/transaction-status-card.tsx` — one linked transaction's status
  badge (same `claimed` mint treatment as `transaction-table.tsx`), amount,
  and its `qr_payload` rendered as a QR (`qr-code-view.tsx`) — or "Not yet
  created." before the balance checkout exists. `qr_payload` isn't tagged
  with a checkout `type` in the DB, so this always renders it as a QR; for
  a `pointer`-kind BYO vendor using a payment **link** that still scans
  fine (opens the link), a BYO **QR image** vendor is the one real
  degraded case (an image URL re-encoded as a QR instead of shown as the
  image) — accepted for this round rather than widening `transactions`'
  schema to persist `type`.
- `[id]/qr-code-view.tsx` — thin `"use client"` wrapper around
  `react-qr-code`'s `QRCode`, same reason `payment-config-form.tsx` needs
  one: kept out of the (server) detail page itself.
- `[id]/create-balance-checkout-button.tsx` /
  `[id]/cancel-booking-dialog.tsx` — direct-call client actions (`useTransition`,
  same shape as `plan/upgrade-cta.tsx`) wiring `createBalanceCheckoutAction`/
  `cancelBookingAction` to a toast/inline-error.
- `[id]/*.dom.test.tsx` — coverage for each of the above.

## Connectivity

Reachable from `dashboard-nav.tsx`'s "Bookings" link. Both dialogs/buttons
call into `actions.ts`, which calls `@/lib/checkout`'s `createCheckout` (the
same function `POST /api/v1/checkout` uses) and `@/lib/bookings`/`@/lib/
transactions` for reads.

## Parent

[dashboard](../README.md)

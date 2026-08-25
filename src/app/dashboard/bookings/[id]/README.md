# [id]

## Purpose

A single booking's detail view: both its linked transactions'
status/QR, the action to create the balance checkout once eligible,
reschedule, cancel (optionally with a refund), and print a summary. Next
16 dynamic route (`params` is a `Promise`).

## Contents

- `page.tsx` — `BookingDetailPage({params})` (server): `notFound()`s on a
  missing/not-owned booking (RLS already filters `getBooking` — see
  `@/lib/bookings` — to this vendor; a wrong id just reads back `null`),
  then renders the booking's fields, both linked transactions via
  `TransactionStatusCard`, `CreateBalanceCheckoutButton` (only once a
  deposit transaction exists and a balance one doesn't yet),
  `RescheduleBookingDialog`, and `CancelBookingDialog` (passed both
  transactions so it can offer a refund field when exactly one is
  confirmed) — every action hidden once the booking is already
  `cancelled`.
- `page.dom.test.tsx` — the 404 path (mocks `next/navigation`'s
  `notFound` to throw, same pattern as `src/lib/admin.test.ts`), field
  rendering, and every action-visibility branch (balance-checkout
  eligibility, cancelled hides every action).
- `transaction-status-card.tsx` — one linked transaction's status badge
  (same `claimed` mint treatment as `transactions/transaction-table.tsx`),
  amount, and its `qr_payload` rendered as a QR (`qr-code-view.tsx`) — or
  "Not yet created." before the balance checkout exists. `qr_payload`
  isn't tagged with a checkout `type` in the DB, so this always renders it
  as a QR; for a `pointer`-kind BYO vendor using a payment **link** that
  still scans fine (opens the link), a BYO **QR image** vendor is the one
  real degraded case (an image URL re-encoded as a QR instead of shown as
  the image) — accepted for this round rather than widening
  `transactions`' schema to persist `type`.
- `qr-code-view.tsx` — thin `"use client"` wrapper around `react-qr-code`'s
  `QRCode`, same reason `config/payment-config-form.tsx` needs one: kept
  out of the (server) detail page itself.
- `create-balance-checkout-button.tsx` — direct-call client action
  (`useTransition`, same shape as `plan/upgrade-cta.tsx`) wiring
  `createBalanceCheckoutAction` to a toast/error.
- `create-balance-checkout-button.dom.test.tsx` — calls the action with
  the booking id, and toasts success/error.
- `cancel-booking-dialog.tsx` — Dialog + `useTransition` (reason is a
  plain `Textarea`, not a form field — the action takes it as a direct
  argument, not `FormData`) wiring `cancelBookingAction` to a toast on
  success or an inline error, same close/keep-open shape as
  `transactions/refund-dialog.tsx`. Takes both transactions as optional
  props; `refundableTransaction()` only offers a refund-amount field when
  exactly one is `confirmed` — with both confirmed (or neither), it stays
  hidden rather than guessing which one, and the vendor can still file a
  refund per-transaction from the transactions page's own existing action.
- `cancel-booking-dialog.dom.test.tsx` — submits a reason, toasts and
  closes on success, keeps the dialog open with the inline error on
  failure; the refund field's visibility and pass-through.
- `reschedule-booking-dialog.tsx` — same Dialog + `useTransition` shape as
  `cancel-booking-dialog.tsx`, prefilled with the booking's current
  `event_date`/`balance_due_date`, wiring `rescheduleBookingAction`.
- `reschedule-booking-dialog.dom.test.tsx` — prefilled values, submits new
  dates, toasts and closes on success, keeps the dialog open with the
  inline error on failure.
- `print-booking-button.tsx` — `window.print()` trigger, `print:hidden`
  itself so it never appears on the printed page. Every other action
  button on this page is also `print:hidden`, so a printed copy shows only
  the customer/booking/transaction summary.
- `print-booking-button.dom.test.tsx` — renders, calls `window.print`,
  carries `print:hidden`.

## Connectivity

Reached by `booking-table.tsx`'s per-row link and `[id]` in the URL.
Both client components here call into `../actions.ts`, which calls
`@/lib/checkout`'s `createCheckout`.

## Parent

[bookings](../README.md)

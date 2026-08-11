# transactions

## Purpose

The vendor's transaction history — every checkout paykit has run for them,
across every kit — plus, for Pro vendors, a per-transaction refund action.

## Contents

- `page.tsx` — `TransactionsPage()` (server): calls `getVendorSession()`/
  `getVendorPlan()` and `listTransactions()`, renders `TransactionTable`.
  Content sits in a plain `mx-auto max-w-4xl` div (not `<main>` — the
  parent `dashboard/layout.tsx` owns that landmark and the page-family's
  canonical `max-w-7xl` outer width); a 5-6 column table reads better
  narrower than the full dashboard width.
- `transaction-table.tsx` — `TransactionTable({ transactions, isPro })`:
  renders `Kit`/`Order ref`/`Amount`/`Status`/`Created` columns (`@/components/
ui/table`), plus a `Refund` column with `RefundDialog` when `isPro`. Amounts
  are formatted via `Intl.NumberFormat` (SGD). Empty state is a plain "No
  transactions yet." message.
- `refund-dialog.tsx` — Pro-only dialog: calls `issueRefundAction` to file a
  refund against a `confirmed` transaction (bookkeeping only — no real
  money movement, see `AGENTS.md`'s data model).
- `refund-dialog.dom.test.tsx` — jsdom tests for the refund flow.
- `actions.ts` — `issueRefundAction`: validates the refund form with
  `issueRefundInputSchema`, then inserts into `refunds`. Ownership,
  `confirmed`-only, and Pro-only enforcement is the `refunds_insert_own`
  RLS policy, not this action — it only validates shape/UX.
- `actions.test.ts` — unit coverage for `issueRefundAction`.

## Connectivity

Reachable from `dashboard-nav.tsx`'s "Transactions" link. `page.tsx` reads
transactions via `@/lib/vendor-session` and `@/lib/transactions`, and
renders `transaction-table.tsx`, which renders `refund-dialog.tsx` for Pro
vendors — that dialog calls `issueRefundAction` in `actions.ts`.

## Parent

[dashboard](../README.md)

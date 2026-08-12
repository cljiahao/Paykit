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
  money movement, see `AGENTS.md`'s data model). The `useActionState`
  action passed in is a local wrapper around `issueRefundAction` (not the
  server action directly): on `status: "ok"` it toasts, resets the form
  (`formRef`), and closes the dialog (`setOpen(false)`) inline, as part of
  the submit itself — not a `useEffect` keyed on the result, which
  `eslint-plugin-react-hooks`'s `set-state-in-effect` rule flags. Without
  this, a successful refund left the dialog open with the same
  amount/reason still filled in and the submit button re-enabled, inviting
  an accidental duplicate refund.
- `refund-dialog.dom.test.tsx` — jsdom tests for the refund flow: opening
  and wiring the transaction id, that a successful submit toasts, clears,
  and closes the dialog (reopening shows a blank form), and that a failed
  submit keeps the dialog open with the inline error.
- `actions.ts` — `issueRefundAction`: validates the refund form with
  `issueRefundInputSchema`, then inserts into `refunds` and calls
  `revalidatePath("/dashboard/transactions")` so the transactions table
  reflects the refund without a manual reload. Ownership, `confirmed`-only,
  and Pro-only enforcement is the `refunds_insert_own` RLS policy, not this
  action — it only validates shape/UX.
- `actions.test.ts` — unit coverage for `issueRefundAction`.
- `page.dom.test.tsx` — awaits `TransactionsPage()` directly and renders
  the result (same pattern as `dashboard/layout.dom.test.tsx`), with
  `TransactionTable` rendered for real: the empty state, and that the
  Refund column only shows for a Pro vendor (including no-config-yet
  defaulting to Free).

## Connectivity

Reachable from `dashboard-nav.tsx`'s "Transactions" link. `page.tsx` reads
transactions via `@/lib/vendor-session` and `@/lib/transactions`, and
renders `transaction-table.tsx`, which renders `refund-dialog.tsx` for Pro
vendors — that dialog calls `issueRefundAction` in `actions.ts`.

## Parent

[dashboard](../README.md)

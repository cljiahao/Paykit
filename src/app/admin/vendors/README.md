# vendors

## Purpose

Admin vendors console — every vendor with a payment config, their triage
status, plan, transaction count, and a Free/Pro plan toggle.

## Contents

- `page.tsx` — `AdminVendorsPage`: fetches `listVendors()` (pre-sorted
  most-urgent status first) and renders the vendor table
  (`ElevatedCard`-wrapped) — vendor email with `payee_name`/`label` as a
  muted subline, a `VendorStatusBadge` status column, plan badge,
  transaction count, joined date, and a `VendorPlanToggle` action column.
- `vendor-status.tsx` — `VendorStatusBadge`: wraps `@merqo/ui`'s shared
  `StatusBadge` with a `Record<VendorStatus, StatusBadgeConfig>` built from
  paykit's own theme-aware brand tokens (`destructive`/`primary`/`muted`/
  `flow`/`mint`) — one color per triage band from `@/lib/vendor-health`.
- `vendor-plan-toggle.tsx` — `VendorPlanToggle`: calls the `setVendorPlan`
  Server Action to flip a vendor's `vendor_payment_config.plan` between
  `free` and `pro` immediately, no confirm modal.

## Parent

[admin](../README.md)

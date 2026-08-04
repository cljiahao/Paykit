# vendors

## Purpose

Admin vendors console — every vendor with a payment config, their plan,
transaction count, and a Free/Pro plan toggle.

## Contents

- `page.tsx` — `AdminVendorsPage`: fetches `listVendors()` and renders the
  vendor table (`ElevatedCard`-wrapped) — vendor email with `payee_name`/
  `label` as a muted subline, plan badge, transaction count, joined date,
  and a `VendorPlanToggle` action column.
- `vendor-plan-toggle.tsx` — `VendorPlanToggle`: calls the `setVendorPlan`
  Server Action to flip a vendor's `vendor_payment_config.plan` between
  `free` and `pro` immediately, no confirm modal.

## Parent

[admin](../README.md)

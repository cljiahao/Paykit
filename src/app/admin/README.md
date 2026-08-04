# admin

## Purpose

Merqo-team internal admin console — the gated layout, shared nav, and shared
figure-tile helper used by the overview and vendors screens.

## Contents

- `actions.ts` — Server Actions (admin-only via `requireAdmin()`):
  `setVendorPlan` writes `vendor_payment_config.plan` directly via the
  service-role client (the intended write path — `plan` is writer-restricted
  to service_role only, see `0001_paykit_core.sql`), then appends an
  `admin_audit` row.
- `admin-nav.tsx` — `AdminNav` client component: the Overview/Vendors tab
  bar, highlighting the active section by path.
- `layout.tsx` — `AdminLayout`: gates every `/admin` route with
  `requireAdmin()`, renders the header (wordmark, Admin badge, sign-out) and
  `AdminNav`.
- `page.tsx` — `AdminOverviewPage`: platform-wide stat tiles (vendors by
  plan, transactions by status, confirmed volume) and a recent
  cross-vendor activity feed, wrapped in `ElevatedCard`.
- `stat.tsx` — `Stat`: a small labeled-value tile (`ElevatedCard`-based)
  used on the admin overview page.
- `vendors/`

## Connectivity

`vendors/` is the one admin section linked from `admin-nav.tsx`'s tab bar
(alongside this folder's own `page.tsx` for Overview); both render inside
`layout.tsx`'s gated shell. `vendors/page.tsx` pulls `actions.ts` for the
Server Action its `VendorPlanToggle` client component calls.

## Parent

[app](../README.md)

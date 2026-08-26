# admin

## Purpose

Merqo-team internal admin console — the gated layout, shared nav, and shared
figure-tile helper used by the overview and vendors screens.

## Contents

- `actions.ts` — Server Actions (admin-only via `requireAdmin()`):
  `setVendorPlan` writes `vendor_payment_config.plan` directly via the
  service-role client (the intended write path — `plan` is writer-restricted
  to service_role only, see `0001_paykit_core.sql`), then appends an
  `admin_audit` row; `setPricing` updates the single `pricing` row
  (`monthly_cents`) the same way, revalidating every route that displays
  the price. `recordAudit()` is exported from here so other real mutating
  actions outside `/admin` (e.g. `issueRefundAction` in
  `dashboard/transactions/actions.ts`) can append an `admin_audit` row too
  — see `admin_audit`'s own retention/immutability notes in the repo-root
  `AGENTS.md`.
- `activity/` — the Activity tab: `page.tsx` (`AdminActivityPage`) reads the
  100 most recent `admin_audit` rows via `auditLog()` (`admin-data.ts`) and
  maps each to `@merqo/ui`'s `AuditLogEntry` shape (actor resolved to email
  the same way `page.tsx`'s own recent-activity feed resolves a vendor,
  falling back to the raw `admin_id`; `detail`'s jsonb rendered as a flat
  `key: value` list). `activity-section.tsx` (`ActivitySection`, client
  component — mirrors why `pricing-section.tsx` is one) renders those
  entries with `AuditLogTable`, mapping the real action strings written by
  `recordAudit()` call sites (`set_vendor_plan`, `set_pricing`,
  `record_refund`, `create_booking`, `create_balance_checkout`,
  `cancel_booking`, `reschedule_booking`) to human-readable labels —
  `formatAction` is a function prop, so it can't cross the server/client
  boundary via `page.tsx` directly.
- `admin-nav.tsx` — `AdminNav` client component: the Overview/Vendors/Activity
  tab bar, highlighting the active section by path.
- `layout.tsx` — `AdminLayout`: gates every `/admin` route with
  `requireAdmin()`, renders the header (wordmark, Admin badge, sign-out) and
  `AdminNav`.
- `page.tsx` — `AdminOverviewPage`: platform-wide stat tiles (vendors by
  plan, transactions by status, confirmed volume), a recent cross-vendor
  activity feed (`ElevatedCard`-wrapped), and a Pricing section
  (`PricingSection`) for editing the live Pro price.
- `pricing-section.tsx` — `PricingSection`: client component wrapping
  `@merqo/ui`'s `PricingForm` with paykit's single `monthly_cents` field,
  wiring `setPricing` (`onSave`) and the `sonner` toast convention every
  other paykit form already uses.
- `stat.tsx` — `Stat`: a small labeled-value tile (`ElevatedCard`-based,
  wrapping `@merqo/ui`'s shared `StatTile` for the label/value content)
  used on the admin overview page.
- `vendors/`

## Connectivity

`vendors/` and `activity/` are the admin sections linked from
`admin-nav.tsx`'s tab bar (alongside this folder's own `page.tsx` for
Overview); all render inside `layout.tsx`'s gated shell. `vendors/page.tsx`
pulls `actions.ts` for the Server Action its `VendorPlanToggle` client
component calls. `activity/page.tsx` pulls `admin-data.ts`'s `auditLog()`
(read-only — no Server Action of its own).

## Parent

[app](../README.md)

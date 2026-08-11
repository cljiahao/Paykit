# stats

## Purpose

Confirmed revenue by day, aggregated across every kit that uses paykit for
a vendor. Pro only — Free vendors see an upsell instead of the chart.

## Contents

- `page.tsx` — `StatsPage()` (server): calls `getVendorSession()`/
  `getVendorPlan()`; on Free, returns an upsell message in a plain
  `mx-auto max-w-lg` div; on Pro, calls `listTransactions()` +
  `aggregateRevenueByDay()` (`@/lib/revenue-report`) and renders
  `RevenueChart` inside a plain `mx-auto max-w-3xl` div. Neither branch
  uses `<main>` — the parent `dashboard/layout.tsx` owns that landmark and
  the page-family's canonical `max-w-7xl` outer width; a chart this size
  reads better narrower than the full dashboard width.
- `revenue-chart.tsx` — `RevenueChart({ data })`: client component, a
  `recharts` `BarChart` (dollars by day) inside a `ResponsiveContainer`.

## Connectivity

Reachable from `dashboard-nav.tsx`'s "Stats" link. `page.tsx` reads via
`@/lib/vendor-session` and `@/lib/transactions`, aggregates via
`@/lib/revenue-report`, and renders `revenue-chart.tsx`.

## Parent

[dashboard](../README.md)

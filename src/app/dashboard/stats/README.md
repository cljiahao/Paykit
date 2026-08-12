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
- `revenue-chart.tsx` — `RevenueChart({ data })`: client component. A 3-tile
  stat row (`StatTile`: Total revenue, Transactions, Avg / day) sits above
  the chart, computed from the existing `data` prop — no separate fetch —
  followed by a `recharts` `BarChart` (dollars by day, bars filled with
  `var(--color-mint)`, the brand accent, not the near-monochrome
  `--color-primary` it used before) inside a `ResponsiveContainer`. Recharts
  renders to an inline SVG with no text alternative of its own, so the
  chart's wrapping `div` carries `role="img"` + a summarizing `aria-label`
  (total SGD revenue, day count, date range), plus an `sr-only` `<table>`
  of the underlying per-day data for screen readers that want the actual
  numbers, not just the summary.
- `page.dom.test.tsx` — awaits `StatsPage()` directly and renders the
  result (same pattern as `dashboard/layout.dom.test.tsx`): the Free/no-
  config upsell branch, and the Pro branch's `listTransactions` →
  `aggregateRevenueByDay` wiring into the chart's data prop.
  `RevenueChart` is stubbed since `ResponsiveContainer` needs real layout
  to size itself, which jsdom doesn't provide.
- `revenue-chart.dom.test.tsx` — the chart's own coverage: the aria-label
  summary branches, the sr-only per-day table, and the 3 stat tiles
  (including the all-zero state when `data` is empty).

## Connectivity

Reachable from `dashboard-nav.tsx`'s "Stats" link. `page.tsx` reads via
`@/lib/vendor-session` and `@/lib/transactions`, aggregates via
`@/lib/revenue-report`, and renders `revenue-chart.tsx`.

## Parent

[dashboard](../README.md)

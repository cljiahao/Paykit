# dashboard

## Purpose

The authenticated vendor area — a shared header/nav shell wrapping the
sub-routes a vendor uses to configure payment, watch transactions, see
revenue stats, manage their Pro plan, and edit their account profile.

## Contents

- `layout.tsx` — `DashboardLayout({ children })` server component: calls
  `getVendorSession()` (redirects to `/login` if signed out) and
  `getVendorPlan()`/`getOrCreateVendorProfile()` in parallel, reads the
  vendor's profile icon off `user.user_metadata.avatar_url`, and renders
  `dashboard-nav.tsx` around `{children}` plus `DashboardTour`. The nav is
  wrapped in `<div className="contents print:hidden">`, not a plain `<div>`
  — `@merqo/ui`'s `DashboardNav` renders its own sticky `<header>`
  internally now (2026-08-05 `@merqo/ui` migration), and a plain wrapper
  div would become the sticky header's containing block at exactly its own
  height, breaking `position: sticky`. `display: contents` removes the
  wrapper's own box from layout so `<header>` stays a direct child of the
  `min-h-screen` container, same as pre-migration.
- `layout.dom.test.tsx` — regression guard for the above: asserts the
  wrapper's `className` contains `"contents"` and that exactly one
  `<header>` element exists in the composed `layout.tsx` tree (a
  per-component `DashboardNav` test alone wouldn't catch a wrapper-`<div>`
  regression at the layout composition level).
- `dashboard-nav.tsx` — `DashboardNav({ signOut, vendorName, avatarUrl,
plan })` client component: composes `@merqo/ui`'s `DashboardNav`/
  `AccountMenu` for the sticky header row (burger + inline links + account
  dropdown) instead of hand-rolling it. Owns only paykit-specific bits: the
  wordmark, `LINKS` (`Dashboard`/`Payment setup`/`Transactions`/`Stats`,
  active-route highlighting via `isActive`/`usePathname`), the 2-tier
  (free/pro) `TierBadge` (ported from qkit's 3-tier badge, flattened), and
  thin throw-adapting wrappers around `submitFeedbackAction`/
  `submitSupportMessageAction` (both return a `{success, error}` result;
  `@merqo/ui`'s `onSubmit` contract needs a promise that rejects on
  failure so its own inline error UI can surface it) for the Feedback/Get
  help `Sheet` drawers `@merqo/ui`'s `AccountMenu` now owns. `vendor.name`/
  `subtitle` both carry the real `vendorName` (with an `"Account"`/`"Your
account"` fallback only for the edge case of an empty string) — never a
  static placeholder, since `subtitle` is the only line the dropdown header
  renders next to the trigger. Passes `LinkComponent={Link}` (`next/link`)
  to `@merqo/ui`'s `DashboardNav` (v0.10.0+) so internal nav links do a
  client-side transition instead of a full page reload; `DashboardNav`
  forwards it down to the `AccountMenu` it composes internally, so this
  one call site covers both — paykit has no standalone `AccountMenu` usage.
- `dashboard-nav.dom.test.tsx` — RTL/jsdom tests: the inline links render
  with correct hrefs, the account-menu item order, that Sign out is a
  genuine form submit reaching the `signOut` action, that Get help opens a
  Sheet mapping its message to `submitSupportMessageAction`'s `body` field,
  and that a failed feedback/support submit surfaces an inline error
  rather than failing silently.
- `page.tsx` — `DashboardPage()` (server): shows a running monthly
  transaction count and an empty-state prompt to `/dashboard/config` when
  no payment method is set up yet; the Pro nudge (`shouldNudgePro`) appears
  once a Free-tier vendor crosses real usage — never a hard cap, see
  `docs/superpowers/specs/2026-07-22-paykit-freemium-nudge-redesign-
design.md`. Also reads `vendor_prefs.tour_seen_at` and, if unset, calls
  `@/lib/tour-prefs`'s `stampTourSeen` directly, synchronously, as part of
  this request — the durable half of the onboarding-tour "stamp on start"
  fix; see `src/lib/README.md` and `tour-actions.ts` below for why the
  client-fired path alone isn't reliable.
- `page.dom.test.tsx` — asserts `stampTourSeen` is called when
  `tour_seen_at` is null/missing and never called once it's already set.
- `tour-actions.ts` — `markTourSeen()`, a `"use server"` action wiring
  `@/lib/tour-prefs`'s `stampTourSeen` to `dashboard-tour.tsx`'s
  client-fired `onFirstSeen`. That client path is fire-and-forget and can
  still be aborted by a hard navigation before it lands if one ever
  reaches the tour again — the root cause (`@merqo/ui`'s `DashboardNav`
  rendering nav links as plain `<a>` tags, and the tour's own second step
  spotlighting the real "Payment setup" nav link, inviting exactly that
  click mid-tour) is now fixed via the `LinkComponent={Link}` wiring in
  `dashboard-nav.tsx` above (`@merqo/ui` v0.10.0), but `page.tsx`'s own
  synchronous call (which imports `stampTourSeen` straight from
  `@/lib/tour-prefs`, not through this Server Action, to avoid crossing a
  client/server serialization boundary) stays as defense-in-depth for the
  "stamp on start" fix (#23).
- `tour-actions.test.ts` — unit tests for `markTourSeen`'s upsert
  payload, its no-op when signed out, and its log-not-throw on failure.
- `config/` — payment method setup (PayNow QR, or a vendor's own BYO
  payment link/QR image; no README of its own yet).
- `transactions/` — transaction history + refund dialog (Pro only).
- `stats/` — revenue-by-day chart, Pro only.
- `plan/` — current tier, usage, and the Pro upsell (`UpgradeCta` — a
  button that files a Pro-upgrade request via `requestProUpgradeAction`
  and shows toast feedback; own README).
- `profile/` — stall/shop name and social links (shared across every
  Merqo kit), plus display name/avatar/password (local to paykit; own
  README).

## Connectivity

`layout.tsx` gates every route under `/dashboard` and renders
`dashboard-nav.tsx` around `{children}`; `dashboard-nav.tsx` links out to
`config/`, `transactions/`, `stats/`, `plan/`, `profile/` — the dashboard's
sub-routes for payment setup, transaction history, revenue stats, billing,
and account respectively.

## Parent

[paykit](../../../README.md) — no intermediate `src/`/`src/app/` README
exists yet in this repo; this is the first per-folder README under `src/`.

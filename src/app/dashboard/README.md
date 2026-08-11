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
  `min-h-screen` container, same as pre-migration. `<main>` is the single
  layout-level content-width container (`mx-auto w-full max-w-7xl p-6`,
  matching qkit's canonical dashboard width) — every route under
  `/dashboard` renders into it, and no page below sets its own outer
  width anymore. A page needing a narrower reading width (a form, a short
  card stack) wraps its own content in an inner `mx-auto max-w-*` div
  instead, so the _outer_ boundary — the edge `DashboardNav`'s own
  `max-w-7xl` inner row aligns to — stays consistent across every route.
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
  renders next to the trigger.
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
design.md`. Renders a plain `<div className="mx-auto max-w-2xl space-y-6">`
  (not `<main>` — the layout's `<main>` already owns that landmark), sized
  for its two small info cards rather than stretching to the layout's full
  `max-w-7xl`.
- `page.dom.test.tsx` — same "await the async server component, render the
  result with RTL" pattern as `layout.dom.test.tsx`: the empty-state
  prompt, the transaction count, and the Free/Pro nudge-threshold branches.
- `config/` — payment method setup (PayNow QR, or a vendor's own BYO
  payment link/QR image; own README).
- `transactions/` — transaction history + refund dialog (Pro only; own
  README).
- `stats/` — revenue-by-day chart, Pro only (own README).
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

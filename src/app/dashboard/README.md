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
  the sticky header (`DashboardNav`) around `{children}`.
- `dashboard-nav.tsx` — `DashboardNav({ signOut, vendorName, avatarUrl,
plan })` client component, per `docs/business/2026-07-21-dashboard-nav-
standard.md`: mobile burger + inline `Dashboard`/`Payment setup`/
  `Transactions`/`Stats` links (`LINKS`, active-route highlighting via
  `isActive`/`usePathname`) on the left; an account-menu avatar (real
  photo via `AvatarImage` when `avatarUrl` is set, initials fallback
  otherwise, mint-colored wordmark) on the right, opening a dropdown to
  Profile, Plan, Get help (a `Sheet` drawer rendering `SupportForm` —
  files into the shared cross-kit `merqo.support_messages` inbox as of
  2026-07-23, replacing the earlier `mailto:` interim pattern; see
  `merqo/docs/superpowers/specs/2026-07-23-cross-kit-support-messages-
design.md`), Feedback (a `Sheet` drawer rendering `FeedbackForm`), and
  Sign out (a real `<form action={signOut}>` submit).
- `dashboard-nav.dom.test.tsx` — RTL/jsdom tests: the inline links render
  with correct hrefs, the account-menu item order (Profile, Plan, Get
  help, Feedback, then Sign out), that Sign out is a genuine form submit
  reaching the `signOut` action, and that Get help opens the `SupportForm`
  Sheet rather than navigating away.
- `page.tsx` — `DashboardPage()` (server): shows a running monthly
  transaction count and an empty-state prompt to `/dashboard/config` when
  no payment method is set up yet; the Pro nudge (`shouldNudgePro`) appears
  once a Free-tier vendor crosses real usage — never a hard cap, see
  `docs/superpowers/specs/2026-07-22-paykit-freemium-nudge-redesign-
design.md`.
- `config/` — payment method setup (PayNow QR, or a vendor's own BYO
  payment link/QR image; own README).
- `transactions/` — transaction history + refund dialog (Pro only).
- `stats/` — revenue-by-day chart, Pro only.
- `plan/` — current tier, usage, and the Pro upsell.
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

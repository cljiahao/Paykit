# app

## Purpose

Next.js App Router tree — every page, layout, route handler, and API surface
for this project.

## Contents

- `actions/` — server actions shared across routes: auth, feedback, Pro-upgrade requests, support messages.
- `admin/` — Merqo-team internal admin console (`/admin`), gated by `requireAdmin()` — platform overview stats and a cross-vendor plan-management table.
- `api/` — the cross-kit `v1` payment API (`checkout`, `vendors`) plus internal `merqo/*` provisioning routes.
- `apple-icon.tsx` — `AppleIcon` route handler; renders `brandIcon(180)` as a 180×180 PNG for iOS home-screen touch icons.
- `auth/` — Supabase auth callback route (OAuth code exchange).
- `dashboard/` — authenticated vendor area (payment config, transactions, stats, profile, plan).
- `globals.css` — Tailwind v4 entry point: theme tokens, base layer, and custom utility classes.
- `icon.tsx` — `Icon` route handler; renders `brandIcon(32)` as a 32×32 PNG favicon.
- `layout.tsx` — `RootLayout`. Loads `Space_Grotesk`/`Inter`/`JetBrains_Mono` via `next/font/google`, sets `metadata`, wraps children in `TooltipProvider` + `Toaster`.
- `login/` — combined sign-in/sign-up page, including the "Forgot password?" flow.
- `page.tsx` — `Home` async server component, the marketing landing page. Composes `Nav`, `Hero`, `Benefits`, `HowItWorks`, `Faq`, `Footer`, and `BackToTop` from `@/components/landing/`. No CTA band above the footer, matching qkit.

## Connectivity

`login/` is the vendor auth entry point; `dashboard/` is the authenticated
vendor area. `admin/` is a separate, Merqo-team-only authenticated area
(session-gated the same way as `dashboard/`, but additionally requiring an
`admins` table row). `api/` is the cross-kit payment surface (bearer-secret
authenticated) plus Merqo's admin-facing provisioning routes. `actions/`
holds server actions shared across routes rather than colocated with one
page. `layout.tsx` is the ancestor of every route below; `page.tsx` (the
landing page) is the only route directly under `app/` besides the special
Next.js files.

## Parent

[src](../README.md)

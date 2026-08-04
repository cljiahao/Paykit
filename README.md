# paykit

The Merqo family's shared payment engine. A vendor sets up their payment
method once here — a generated PayNow QR, or their own BYO payment
link/QR image — and any Merqo kit can then request a checkout + track
payment status for that vendor over paykit's HTTP API. paykit never
touches funds — it renders the checkout the customer pays through in
their own bank/payment app, and a human confirms receipt.

In production, the Supabase auth cookie is scoped to `.merqo.io`
(`NEXT_PUBLIC_AUTH_COOKIE_DOMAIN`, `src/lib/supabase/`), so signing in on
one Merqo kit signs you in on the rest. The dashboard's onboarding tour
(`src/components/dashboard-tour.tsx`) stamps its "seen" state as soon as
it auto-runs rather than when it finishes, so a refresh mid-tour can't
make it re-trigger on the next load.

Sign-in (`/login`) supports email+password (with a "Check your email"
confirmation state and a real forgot-password flow) and Google OAuth. Once
signed in, a Free-tier vendor can file a real, one-click Pro-upgrade request
from the dashboard's Plan page — no payment provider involved; Pro is
granted manually, via a Merqo-team-only admin console (`/admin`, gated by
an `admins` allow-list) with platform-wide stats and a per-vendor plan
toggle. `/api/merqo/vendor-status` (merqo hub's own vendor-active/plan
lookup) paginates the Supabase admin-users API properly, via the same
`listAllUsers` helper the admin console uses — it no longer silently
truncates at the first 1000 auth users. The landing footer matches qkit's exactly (single-row
wordmark/tagline/copyright/sign-in link, no CTA band above it), and the
landing page's `BackToTop` button matches the cross-kit landing-page
parity pass.

See `AGENTS.md` for stack, commands, data model, rules, and the AI
harness/CI setup (templateCentral-based); `CHANGELOG.md`
for what's shipped since the MVP, including the "Name | Tagline" Title Case
browser-tab title convention shared across every Merqo kit. Folder-level `README.md`s (`src/lib/`,
`src/components/`, and their subfolders) cover what each module does and
how it's wired together. See
`docs/superpowers/specs/2026-07-15-paykit-mvp-design.md` for the original
approved design and `docs/superpowers/plans/2026-07-15-paykit-mvp.md` for
its implementation plan — later work has its own dated specs/plans under
the same `docs/superpowers/` folders.

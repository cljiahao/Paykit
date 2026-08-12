# paykit

The Merqo family's shared payment engine. A vendor sets up their payment
method once here — a generated PayNow QR, or their own BYO payment
link/QR image — and any Merqo kit can then request a checkout + track
payment status for that vendor over paykit's HTTP API. paykit never
touches funds — it renders the checkout the customer pays through in
their own bank/payment app, and a human confirms receipt. A calling kit
without its own vendor-session UI can also write the config directly via
`POST /api/v1/vendors/{vendor_id}/config` (bearer-secret authenticated,
same schema the dashboard's own config form uses) — see
`src/app/api/v1/vendors/[vendor_id]/config/README.md`.

In production, the Supabase auth cookie is scoped to `.merqo.io`
(`NEXT_PUBLIC_AUTH_COOKIE_DOMAIN`, `src/lib/supabase/`), so signing in on
one Merqo kit signs you in on the rest. The dashboard's onboarding tour
(`src/components/dashboard-tour.tsx`) stamps its "seen" state as soon as
it auto-runs rather than when it finishes, so a refresh mid-tour can't
make it re-trigger on the next load — and since that client-fired stamp
is fire-and-forget and can be aborted by a hard navigation (`@merqo/ui`'s
`DashboardNav` renders nav links as plain `<a>` tags, and the tour's own
steps spotlight one), `/dashboard`'s own server render
(`src/app/dashboard/page.tsx`) also stamps it synchronously, durably, as
part of the request. `POST /api/v1/checkout` is idempotent
on `(kit_slug, order_ref)` — a retried call returns the existing
transaction instead of creating a duplicate. `pnpm-workspace.yaml`'s
`overrides` pins several transitive dependencies (`postcss`, `undici`,
`vite`, `qs`, `sharp`, `nanoid`, `fast-uri`, `js-yaml`, `brace-expansion`)
past known-vulnerable versions Next.js itself and dev tooling still
bundle; `pnpm audit --prod --audit-level=high` is CI's hard gate — bump
the relevant floor here when a new advisory lands, and re-check after any
`next` upgrade in case it's safe to drop one. The dashboard nav, account
menu, profile-page layout, image upload, onboarding tour, and landing nav
now delegate to the shared `@merqo/ui` package (v0.10.1, `package.json`;
kit-family consistency;
paykit keeps its own wordmark, nav links, tier badge, and feedback/support
wiring as thin adapters over the shared components). Every `/dashboard`
route shares one layout-level content-width container (`mx-auto w-full
max-w-7xl` in `src/app/dashboard/layout.tsx`, matching qkit's canonical
dashboard width) instead of each page setting its own, inconsistent width
— pages needing a narrower reading width (forms, short card stacks) nest
an inner `mx-auto max-w-*` div inside it. See `CHANGELOG.md` for the
latest changes.

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

# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- `GET /api/v1/vendors/{vendor_id}/config` now returns the full editable
  `vendor_payment_config` row (`kind`, `payee_name`, `uen`, `mobile`,
  `label`, `url`, `qr_image_url`) alongside the existing `has_config`/
  `display_name` summary fields, instead of the summary alone. Closes the
  gap where a calling kit's own "quick add PayNow details" edit form (e.g.
  qkit's) had every text field start blank when a vendor re-opened payment
  settings, since the kit had no way to read back what was already saved.
- Dashboard onboarding tour re-triggered on every visit to `/dashboard`
  despite #23's "stamp on start, not finish" fix. Root cause: that fix's
  mark-seen write is fire-and-forget from the client
  (`dashboard-tour.tsx`'s `onFirstSeen`), and the tour's own second step
  spotlights the real "Payment setup" nav link — which `@merqo/ui`'s
  `DashboardNav` renders as a plain `<a>` tag, not `next/link` — so
  clicking it (as the tour invites) triggers a hard page navigation that
  can abort the write before it lands, leaving `tour_seen_at` unset.
  `src/app/dashboard/page.tsx` now also stamps `tour_seen_at`
  synchronously during its own server render whenever it's unset — a
  write that lands before the response is even sent, immune to any
  client-side navigation race. `tour-actions.ts`'s `markTourSeen` is
  refactored to share the upsert (`stampTourSeen`) with `page.tsx` instead
  of duplicating it.

### Added

- `POST /api/v1/vendors/{vendor_id}/config` — kit-auth (bearer-secret,
  `verifyKitAuth`) service-role upsert of a vendor's
  `vendor_payment_config` on behalf of a calling kit, reusing
  `vendorPaymentConfigInputSchema` (paynow|pointer) for validation and
  returning the same summary shape as the existing `GET` route (`has_config`/
  `display_name`, plus the full config fields as of the fix above). First
  piece of the qkit→paykit checkout cutover: qkit was
  minted a `kit_api_keys` bearer secret so it can build a lightweight
  "quick add PayNow details" UI inside its own dashboard instead of
  redirecting to paykit's dashboard.

### Changed

- Bumped `@merqo/ui` to v0.9.0. `DashboardNav`'s header now has an inner
  `max-w-7xl` width container (was full-bleed, misaligned against
  dashboard content) — automatic for paykit since `dashboard-nav.tsx`
  already delegates to the shared component. The landing nav
  (`src/components/landing/nav.tsx`) now uses the new shared `LandingNav`
  shell instead of hand-rolling its own sticky/border/backdrop-blur
  header; the wordmark and right-side links/CTAs are unchanged.
- Dashboard account chrome (nav, account menu, Feedback/Get-help sheets,
  profile-icon/QR-image uploader, onboarding tour, tooltip, and settings
  field-group shell) migrated onto the shared `@merqo/ui` v0.8.1 package
  — the same component library qkit adopted first. Local
  `FeedbackForm`/`SupportForm`/`InfoTooltip`/`Section`/`ImageUploader`/
  `tour.css` are deleted; `dashboard-nav.tsx`/`dashboard-tour.tsx`/
  `use-async-action.ts` are now thin paykit-specific wrappers around the
  shared components. No behavior, copy, schema, or payment-processing
  logic changed — UI-layer chrome only.

### Added

- `POST /api/v1/checkout` is now idempotent on `(kit_slug, order_ref)`: a
  retried call (e.g. after a caller-side timeout) returns the transaction
  the first call already created instead of erroring or creating a
  duplicate pending transaction (`0007_paykit_checkout_idempotency.sql`
  adds the unique constraint the route catches the violation on).
- Unit tests for `vendor-session.ts` (`getVendorSession`/`getVendorPlan`),
  the shared dashboard auth guard used by every `/dashboard` page and
  server action — previously covered only indirectly through whatever
  dashboard action tests happened to mock through it.
- A comment-hygiene enforcement layer alongside the existing static ESLint
  gate (`no-inline-comments`, `sonarjs/no-commented-code`): a feedback-only
  `PostToolUse` hook (`post-edit-comment-check.sh`), a warn-only pre-commit
  nudge (`comment-hygiene.sh`), and a CI job scoped to added lines — all
  reading the same `.claude/comment-hygiene-patterns.txt`.
- Merqo-team internal admin console (`/admin`), ported from loopkit's
  admin-console pattern: an `admins` allow-list + `admin_audit` trail
  (`0006_paykit_admin.sql`), an overview page with platform-wide stat
  tiles and a recent cross-vendor activity feed, and a vendors page
  listing every vendor with a plan toggle (`setVendorPlan`). Vendor
  identity is resolved via a new `listAllUsers` helper (paginates the
  Supabase admin API) since `vendor_payment_config.payee_name` is null
  for `kind='pointer'` rows.

### Changed

- `merqo-support.ts`, `merqo-vendor-feedback.ts`, and
  `merqo-vendor-profile.ts` now delegate their `.schema("merqo").rpc(...)`
  call to a new shared `callMerqoRpc` helper (`src/lib/merqo-rpc.ts`)
  instead of each hand-writing the same generic-over-caller's-client cast;
  public function signatures unchanged.
- Landing footer rebuilt to match qkit's exact single-row layout
  (wordmark, tagline, copyright, sign-in link as flex siblings), and the
  bottom call-to-action band above it removed — qkit's landing page never
  had one.

### Fixed

- `.claude/settings.json`'s `Edit` permissions-deny list now also covers
  `.env.*.local` (it already covered the other `.env` variants), matching
  the `Read` deny list.
- `/api/merqo/vendor-status` now paginates the Supabase admin-users
  lookup via `listAllUsers` instead of the old `merqo-auth.ts#listAllAuthUsers`
  (removed), which only ever read the first 1000 auth users — a vendor
  past that ceiling silently resolved as inactive/no-plan to merqo's
  lookup.
- Dashboard onboarding tour now stamps `tour_seen_at` as soon as it
  auto-runs, not when it finishes — a refresh mid-tour no longer makes
  it re-run on every dashboard load.

### Added

- First-visit dashboard onboarding tour (driver.js overlay + floating "?"
  replay button), ported from qkit/stockkit. Seen-state tracked in the new
  `vendor_prefs` table.
- Shared-session SSO across `*.merqo.io` kits: `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN`
  scopes the Supabase auth cookie to `.merqo.io` in production, so signing
  in on one kit signs you in on the rest. A one-time cleanup in
  `src/lib/supabase/middleware.ts` clears each already-signed-in vendor's
  pre-existing host-only cookie (forcing a single re-login) without
  clobbering a same-request token refresh.

### Fixed

- Dashboard nav desktop links now render as the shared `Button asChild
variant="ghost" size="sm"` control instead of a hand-rolled `Link`,
  matching every other kit's dashboard nav.
- Login page brought to cross-kit parity: card container standardized to
  the shared `ElevatedCard`, Google icon extracted into `google-mark.tsx`,
  and wordmark/field/button sizing and copy aligned with the other kits'
  login pages.
- Browser-tab title now uses the cross-kit "Name | Tagline" Title Case
  format: "Paykit | Vendor Payments" (was "paykit: PayNow payments").
- paykit supports both `paynow` and `pointer` (BYO QR/link) payment
  configs, so "PayNow payments" / "shared PayNow payment engine" undersold
  it — reworded to "Vendor Payments" / "shared vendor payment engine"
  (title, description, footer, AGENTS.md).
- `.husky/lib/pre-commit.sh` used `xargs -d '\n'`, a GNU-only flag not
  supported by BSD xargs (macOS default) — broke every local commit
  touching a staged .ts/.tsx/.js/.mjs/.cjs file. Swapped for portable
  `tr '\n' '\0' | xargs -0`.
- Landing and footer "Log in" links renamed to "Sign in" for label parity
  across all Merqo Business kits.
- Dashboard and landing navbar height, padding, and logo size now match
  qkit's spec (`px-5 py-3.5`/`py-4`, `text-3xl` logo).

- Browser-tab title lowercased to match the kit naming convention (was
  "PayKit", PascalCase reserved for the logo mark only) and given a tagline:
  "paykit: PayNow payments".
- Google OAuth on `/login` now forces an English consent screen
  (`queryParams: { hl: "en" }`), matching merqo/qkit/loopkit.

### Added

- Real "Forgot password?" flow on `/login` (sign-in mode only): emails a
  Supabase reset link via `resetPasswordForEmail`, landing on
  `/auth/callback` → `/dashboard/profile`'s existing "Change password"
  field. Toasts an error when the email field is empty or the call fails.
- A real, clickable Pro-upgrade action on the dashboard Plan page
  (`UpgradeCta`) — files an in-product request via the new
  `requestProUpgradeAction` server action instead of just describing the
  upgrade in text; no payment provider involved, Pro is granted manually.
- `BackButton` (`@/components/back-button`), ported from qkit: a real
  hit-target "leave this page" button, replacing the plain underlined
  `<Link>` previously used on the dashboard Plan and Profile pages.
- FAQ link in the landing nav (`landing/nav.tsx`), jumping to the existing
  `faq.tsx` section.
- Login card now uses the shared `Wordmark` (was plain "paykit" text) and a
  real Google "G" mark next to "Continue with Google" (was a bare label,
  no brand glyph).

### Fixed

- `SupportForm`'s category `ToggleGroup` was missing `spacing={1.5}`,
  rendering the category buttons edge-to-edge instead of qkit's
  separated-pill layout.
- Dashboard nav's mobile burger button appeared at the wrong breakpoint
  relative to the inline links, and the account-menu `TierBadge` pill was
  misrendered; both fixed alongside a `Button` sizing fix.
- Sign-up on `/login` no longer silently redirects to `/dashboard` when
  Supabase returns no session (email confirmation on) — it now shows a
  "Check your email" state, with "Back to sign in" returning to the normal
  form.
- templateCentral 5.12 harness sync: `docs/constitution.md` references in
  `.claude/settings.json` and `AGENTS.md` corrected to the canonical
  uppercase `docs/CONSTITUTION.md` casing (already used by
  `protect-files.sh`) so the ask-gate would actually fire if that file is
  ever added; removed the unused, unwired `.claude/hooks/verify.sh`; bumped
  `pnpm/action-setup` in CI from v4.3.0 to v4.4.0.

### Changed

- Migrated git hooks from lefthook to husky — lefthook's unsigned
  `lefthook.exe` is unconditionally blocked by Windows Smart App Control on
  this machine; husky has no native binary. Same checks, same rigor.
- `FeedbackForm`'s NPS score picker and comment field now use shadcn
  `ToggleGroup`/`Textarea` instead of hand-rolled radio buttons and a plain
  `<textarea>`, matching `SupportForm` and qkit's equivalent component. No
  behavior, copy, or schema change.

### Security

- Bumped `next` 16.2.10 → 16.2.11, clearing 9 known advisories (4 high: App
  Router middleware/proxy bypass, Server Actions DoS, Server Actions SSRF
  on custom servers, rewrites SSRF via attacker-controlled hostname; 5
  moderate: response-body cache confusion x2, unbounded Server Action
  payload on Edge, Image Optimization SVG DoS, internal Server Function
  endpoint disclosure) — all fixed upstream, no app code changes needed.

### Added

- `GET /api/merqo/vendor-status` and `POST /api/merqo/vendor-provision` —
  merqo hub integration routes, bearer-secured via new `MERQO_METRICS_SECRET`/
  `MERQO_PROVISION_SECRET` env vars. Both routes are read-only: paykit has no
  safe default for `vendor_payment_config`'s `payee_name`/`uen`/`mobile`
  fields, so provisioning only reports whether a vendor has already
  configured payment collection (`needs_setup: true/false`), never creates a
  placeholder row.
- **Real "Get help" support form**, replacing the mailto-link interim
  pattern — files into the shared cross-kit `merqo.support_messages`
  inbox (Merqo team picks it up in `/admin`), same pattern qkit's own
  local support form uses, now shared infrastructure any kit can call.

### Fixed

- Dashboard account menu was missing the dropdown chevron qkit/loopkit both
  show, and the nav wordmark used the generic (still shadcn-default,
  near-black) `--primary` token instead of paykit's own mint brand color
  already used everywhere else (landing wordmark, hero, icons).

### Docs

- Added the `src/lib/`, `src/lib/payments/`, `src/lib/supabase/`,
  `src/components/`, `src/components/landing/`, and `src/components/ui/`
  `README.md` files — previously bypassed via the `skip-readme-check`
  label on prior PRs that touched those folders.

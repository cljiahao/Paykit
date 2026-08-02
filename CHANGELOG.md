# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

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

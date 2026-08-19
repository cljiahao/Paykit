# components

## Purpose

Shared React components — not scoped to one dashboard sub-route (those live
under `src/app/dashboard/<route>/`). Two subfolders group larger clusters
(`landing/` marketing sections, `ui/` shadcn primitives); everything else
sits flat here.

## Contents

- `back-button.tsx` — `BackButton({ href, label })`: a shadcn
  `Button asChild variant="ghost"` + `ArrowLeft` "leave this page" link,
  ported from qkit. Used in place of a plain underlined `<Link>` so the
  back-to-dashboard nav is a real hit target with hover/focus state.
- `dashboard-tour.tsx` — `DashboardTour({ seen })`: paykit's thin wiring
  around `@merqo/ui`'s `DashboardTour` — supplies this kit's own step
  content (`tourSteps`), mark-seen server action (`markTourSeen`), and
  `/dashboard` routing; the tour mechanism itself (`driver.js` lifecycle,
  floating replay button, popover styling) is fully owned by the shared
  component. Auto-runs once for a vendor who hasn't seen it (server-tracked,
  stamped via `markTourSeen` as soon as the tour starts rather than when it
  finishes, so a mid-tour refresh can't re-trigger it), and can be replayed
  from any page (navigates back to `/dashboard` first if needed).
- `dashboard-tour.dom.test.tsx` — RTL tests for the tour's auto-run,
  mark-seen, and cross-page replay behavior.
- `tour-steps.ts` — `tourSteps(isMobile)`: pure step config (element
  selector + title + description) for the dashboard tour, kept free of any
  DOM/React dependency so it's trivially unit-testable. The first step's
  description embeds a `.tour-example` HTML snippet (styled in
  `src/app/globals.css`, rendered via driver.js's own `innerHTML` popover)
  showing an example transaction.
- `tour-steps.test.ts` — unit tests asserting the mobile/desktop step lists.
- `elevated-card.tsx` — `ElevatedCard({ as, className, children })`: the
  shared raised-card container (rounded, bordered, soft shadow) used by the
  login page, matching every other kit's login page.
- `social-icons.tsx` — `SOCIAL_LINK_FIELDS`: the website/Instagram/
  Facebook/TikTok field list (plain lucide glyphs, not brand-mark icons).
- `social-links-fields.tsx` — the input-field group rendering
  `SOCIAL_LINK_FIELDS` for the profile settings page.

`FeedbackForm`/`SupportForm`/`ImageUploader`/`InfoTooltip`/`Section` were
migrated onto `@merqo/ui`'s shared versions (2026-08-05 `@merqo/ui`
migration) and deleted from here — `FeedbackForm`/`SupportForm` had zero
call sites outside `dashboard-nav.tsx` and fully absorbed into `@merqo/ui`'s
`AccountMenu`; `ImageUploader`/`InfoTooltip`/`Section` are now imported
directly from `@merqo/ui` at their call sites (`src/app/dashboard/
profile/profile-form.tsx`, `src/app/dashboard/config/payment-config-form.tsx`).
paykit's own upload glue (resize + Supabase Storage write) lives in
`@/lib/image-upload-adapter.ts` now, wired through `@merqo/ui`'s
`ImageUploader`'s `onUpload`/`resizeImage` props.

## Connectivity

`dashboard-tour.tsx` is rendered from `src/app/dashboard/layout.tsx` and
delegates to `@merqo/ui`'s `DashboardTour`. `social-links-fields.tsx` is
used by the dashboard profile settings page. `BackButton` is used by the
dashboard `profile/` and `plan/` pages. `landing/` is only used by
`src/app/page.tsx`. `ui/` is used everywhere. `@merqo/ui`'s `AccountMenu`
(rendered from `dashboard-nav.tsx`) owns the Feedback/Get-help `Sheet`
drawers, wired to `submitFeedbackAction`/`submitSupportMessageAction` in
`src/app/actions/`.

## Parent

[paykit](../../README.md)

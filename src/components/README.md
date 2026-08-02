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
- `dashboard-tour.tsx` — `DashboardTour({ seen })`: owns the dashboard
  onboarding tour — a floating "?" replay button plus a lazily-imported
  `driver.js` overlay (loaded only when the tour actually runs). Auto-runs
  once for a vendor who hasn't seen it (server-tracked, stamped via
  `markTourSeen` as soon as the tour starts rather than when it finishes,
  so a mid-tour refresh can't re-trigger it), and can be replayed from any
  page (navigates back to `/dashboard` first if needed).
- `dashboard-tour.dom.test.tsx` — RTL tests for the tour's auto-run,
  mark-seen, and cross-page replay behavior.
- `tour-steps.ts` — `tourSteps(isMobile)`: pure step config (element
  selector + title + description) for the dashboard tour, kept free of any
  DOM/React dependency so it's trivially unit-testable.
- `tour-steps.test.ts` — unit tests asserting the mobile/desktop step lists.
- `tour.css` — scoped styles for the `driver.js` popover (`.paykit-tour`
  class) so the tour overlay matches the app's visual language.
- `elevated-card.tsx` — `ElevatedCard({ as, className, children })`: the
  shared raised-card container (rounded, bordered, soft shadow) used by the
  login page, matching every other kit's login page.
- `feedback-form.tsx` — `FeedbackForm`: vendor NPS (shadcn `ToggleGroup`,
  0–10) + optional comment (shadcn `Textarea`) widget, mounted in a Sheet
  off the account menu. Ported from Merqo hub's own FeedbackForm; paykit
  has no orders/booths so only the NPS branch applies.
- `support-form.tsx` — `SupportForm`: categorized (shadcn `ToggleGroup`)
  Get-help widget, same Sheet-mounted shape as `FeedbackForm`. Submits to
  the shared cross-kit `merqo.support_messages` inbox via
  `submitSupportMessageAction`.
- `image-uploader.tsx` — client-side image picker: resizes/re-encodes to
  WebP (`@/lib/image-resize`) before uploading via the browser Supabase
  client. Accepts jpeg/png/webp only (no SVG).
- `info-tooltip.tsx` — `InfoTooltip`: the shared `(i)`-trigger used wherever
  a field or `Section` needs one more sentence of explanation instead of a
  bordered helper paragraph.
- `section.tsx` — `Section`: shared field-group shell for dashboard
  settings pages (icon chip, eyebrow, title, description, optional
  tooltip). paykit's own bordered-box style, not qkit's ticket-shaped card.
- `social-icons.tsx` — `SOCIAL_LINK_FIELDS`: the website/Instagram/
  Facebook/TikTok field list (plain lucide glyphs, not brand-mark icons).
- `social-links-fields.tsx` — the input-field group rendering
  `SOCIAL_LINK_FIELDS` for the profile settings page.

## Connectivity

`FeedbackForm`/`SupportForm` are rendered inside `dashboard-nav.tsx`'s
Feedback/Get-help `Sheet` drawers and call actions in `src/app/actions/`.
`Section`/`InfoTooltip`/`social-links-fields.tsx` are used by the dashboard
profile/config settings pages. `BackButton` is used by the dashboard
`profile/` and `plan/` pages. `landing/` is only used by `src/app/page.tsx`.
`ui/` is used everywhere.

## Parent

[paykit](../../README.md)

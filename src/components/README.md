# components

## Purpose

Shared React components — not scoped to one dashboard sub-route (those live
under `src/app/dashboard/<route>/`). Two subfolders group larger clusters
(`landing/` marketing sections, `ui/` shadcn primitives); everything else
sits flat here.

## Contents

- `feedback-form.tsx` — `FeedbackForm`: vendor NPS + optional comment
  widget, mounted in a Sheet off the account menu. Ported from Merqo hub's
  own FeedbackForm; paykit has no orders/booths so only the NPS branch
  applies.
- `support-form.tsx` — `SupportForm`: Get-help widget, same Sheet-mounted
  shape as `FeedbackForm`. Submits to the shared cross-kit
  `merqo.support_messages` inbox via `submitSupportMessageAction`.
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
profile/config settings pages. `landing/` is only used by `src/app/page.tsx`.
`ui/` is used everywhere.

## Parent

[paykit](../../README.md)

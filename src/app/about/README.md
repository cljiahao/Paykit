# about

## Purpose

The public "Why Merqo" page, linked from the landing `Nav` and `Footer`.

## Contents

- `page.tsx` — `AboutPage`, an async Server Component. Reflects the
  session (same pattern as `src/app/page.tsx`) so `Nav` shows
  Dashboard/Sign in correctly. The story itself is `@merqo/ui`'s shared
  `AboutMerqo` component (one source, reused by merqo and every other
  kit's own `/about` page) — this page supplies only `Nav`/`Footer` and a
  "See how paykit works" CTA linking to `/#how`.
- `page.dom.test.tsx` — covers the origin-story copy, the paykit-specific
  closing line, and the CTA link.

## Connectivity

Linked from `Nav` (`src/components/landing/nav.tsx`) and `Footer`
(`src/components/landing/footer.tsx`).

## Parent

[app](../README.md)

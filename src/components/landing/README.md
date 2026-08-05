# landing

## Purpose

The marketing homepage (`src/app/page.tsx`), broken into one section per
file. Presentational only — no data fetching, no client state beyond the
`authed` prop threaded down from the page for the nav/CTA sign-in links.

## Contents

- `nav.tsx` — sticky top nav, built on `@merqo/ui`'s shared `LandingNav`
  shell (sticky/border/backdrop-blur header, `max-w-6xl` row): `Wordmark`
  as the `wordmark` prop, an `#faq` anchor link (sm+, same-page hash jump
  to `faq.tsx`'s section) + sign-in/dashboard link as the `end` prop.
  Header padding/logo size (`text-3xl` wordmark) matches qkit's landing
  nav exactly, since both consume the same shared shell.
- `hero.tsx` — headline, stat row, CTA, and the decorative `CheckoutCard`.
- `checkout-card.tsx` — stylized non-functional "live checkout" artifact for
  the hero (not a real scannable QR — a stand-in with a status pill using
  the product's own pending/claimed/confirmed language).
- `benefits.tsx` — the "why paykit" feature grid.
- `how-it-works.tsx` — 3-step explainer (connect method → share checkout →
  confirm).
- `faq.tsx` — static Q&A list, including "does paykit hold my money?".
- `footer.tsx` — single-row site footer matching qkit's landing footer
  exactly — `Wordmark`, tagline, copyright line, `Vendor sign in →` link.
  No bottom call-to-action band above it (removed to match qkit, which
  never had one).
- `footer.test.tsx` — asserts the wordmark link, tagline, copyright line,
  and sign-in link all render.
- `back-to-top.tsx` — fixed-position scroll-to-top button (ported from qkit),
  shown past a scroll threshold.
- `wordmark.tsx` — `Wordmark`: the "Pay**kit**" mark, mint accent on "Pay"
  (distinct from qkit's ember / loopkit's gold) — visual mark only, prose
  stays lowercase "paykit" per
  `Merqo Business/docs/business/2026-07-15-kit-brand-naming-convention.md`.

## Connectivity

Assembled by `src/app/page.tsx` in the order listed above (nav → hero →
benefits → how-it-works → faq → footer → back-to-top). `wordmark.tsx`
is also used by `dashboard-nav.tsx` outside this folder.

## Parent

[components](../README.md)

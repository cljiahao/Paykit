# landing

## Purpose

The marketing homepage (`src/app/page.tsx`), broken into one section per
file. Presentational only — no data fetching, no client state beyond the
`authed` prop threaded down from the page for the nav/CTA sign-in links.

## Contents

- `nav.tsx` — sticky top nav: `Wordmark` + sign-in/dashboard link.
- `hero.tsx` — headline, stat row, CTA, and the decorative `CheckoutCard`.
- `checkout-card.tsx` — stylized non-functional "live checkout" artifact for
  the hero (not a real scannable QR — a stand-in with a status pill using
  the product's own pending/claimed/confirmed language).
- `benefits.tsx` — the "why paykit" feature grid.
- `how-it-works.tsx` — 3-step explainer (connect method → share checkout →
  confirm).
- `faq.tsx` — static Q&A list, including "does paykit hold my money?".
- `cta.tsx` — bottom-of-page sign-up call to action.
- `footer.tsx` — `Wordmark` + links.
- `wordmark.tsx` — `Wordmark`: the "Pay**kit**" mark, mint accent on "Pay"
  (distinct from qkit's ember / loopkit's gold) — visual mark only, prose
  stays lowercase "paykit" per
  `Merqo Business/docs/business/2026-07-15-kit-brand-naming-convention.md`.

## Connectivity

Assembled by `src/app/page.tsx` in the order listed above (nav → hero →
benefits → how-it-works → faq → cta → footer). `wordmark.tsx` is also used
by `dashboard-nav.tsx` outside this folder.

## Parent

[components](../README.md)

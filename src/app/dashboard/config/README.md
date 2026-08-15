# config

## Purpose

Payment method setup — a vendor picks between a generated PayNow QR or their
own BYO payment link/QR image, and saves it as their `vendor_payment_config`.

## Contents

- `page.tsx` — server component: loads the vendor's current config, renders
  `PaymentConfigForm`. Content sits in a plain `mx-auto max-w-lg` div (not
  `<main>` — the parent `dashboard/layout.tsx` owns that landmark and the
  page-family's canonical `max-w-7xl` outer width); a form this size reads
  better narrower than the full dashboard width.
- `pointer-presets.ts` — pure data module for the BYO preset picker: the
  `POINTER_PRESETS` catalogue (Stripe Payment Link, HitPay Payment Link,
  PayLah! QR, Other/Custom), `POINTER_PRESET_ORDER`, and
  `derivePointerPreset()` — a best-effort re-derivation of which preset an
  existing saved `pointer` config likely came from, used to pre-select the
  picker on edit. UI-only: no preset ID is persisted, see
  `docs/superpowers/specs/2026-08-14-paykit-byo-preset-directory-design.md`.
- `payment-config-form.tsx` — client form: radio-toggles between PayNow/BYO
  `kind`; for BYO, a `pointer-presets.ts` card picker drives which mode
  (link vs QR) is locked, what pre-fills the label, and which "where to
  find this" instructions/URL-shape warning render, before falling through
  to the same link input or `@merqo/ui` `ImageUploader` (wired through
  `uploadPaykitImage`/`resizeToWebp` from `src/lib/`, `imageComponent={Image}`,
  `variant="thumb"`) as before; live-previews the generated PayNow QR for
  the `paynow` branch.
- `payment-config-form.dom.test.tsx` — RTL/jsdom coverage of both `kind`
  branches, the preset picker, and the save flow.
- `pointer-presets.test.ts` — unit coverage for every preset's `urlPattern`
  (where present) and `derivePointerPreset()`'s Stripe/HitPay/fallback
  branches.
- `page.dom.test.tsx` — awaits `ConfigPage()` directly and renders the
  result (same pattern as `dashboard/layout.dom.test.tsx`), with
  `PaymentConfigForm` stubbed so the test stays focused on `page.tsx`'s own
  job: fetching the vendor + config and passing them through as props.
- `actions.ts` — `saveConfigAction`: validates + persists the form via the
  vendor-scoped RLS client. Persists with an explicit select-then-
  insert-or-update, not `.upsert()`: PostgREST's `ON CONFLICT DO UPDATE`
  path requires table-level `UPDATE` privilege regardless of column-level
  grants, but `vendor_payment_config`'s `UPDATE` grant is deliberately
  column-scoped to exclude `plan` (a vendor must never self-escalate to
  Pro) — `.upsert()` failed permission checks on every save as a result.
- `actions.test.ts` — unit coverage for both config kinds, validation
  failures, and the insert-vs-update branch.

## Parent

[dashboard](../README.md)

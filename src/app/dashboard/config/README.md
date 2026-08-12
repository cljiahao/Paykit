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
- `payment-config-form.tsx` — client form: radio-toggles between PayNow/BYO
  `kind`, live-previews the generated PayNow QR, and for the BYO `qr_image_url`
  field uses `@merqo/ui`'s `ImageUploader` (wired through
  `uploadPaykitImage`/`resizeToWebp` from `src/lib/`, `imageComponent={Image}`,
  `variant="thumb"`).
- `payment-config-form.dom.test.tsx` — RTL/jsdom coverage of both `kind`
  branches and the save flow.
- `page.dom.test.tsx` — awaits `ConfigPage()` directly and renders the
  result (same pattern as `dashboard/layout.dom.test.tsx`), with
  `PaymentConfigForm` stubbed so the test stays focused on `page.tsx`'s own
  job: fetching the vendor + config and passing them through as props.
- `actions.ts` — `saveConfigAction`: validates + persists the form via the
  vendor-scoped RLS client.
- `actions.test.ts` — unit coverage for both config kinds and validation
  failures.

## Parent

[dashboard](../README.md)

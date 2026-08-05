# config

## Purpose

Payment method setup — a vendor picks between a generated PayNow QR or their
own BYO payment link/QR image, and saves it as their `vendor_payment_config`.

## Contents

- `page.tsx` — server component: loads the vendor's current config, renders
  `PaymentConfigForm`.
- `payment-config-form.tsx` — client form: radio-toggles between PayNow/BYO
  `kind`, live-previews the generated PayNow QR, and for the BYO `qr_image_url`
  field uses `@merqo/ui`'s `ImageUploader` (wired through
  `uploadPaykitImage`/`resizeToWebp` from `src/lib/`, `imageComponent={Image}`,
  `variant="thumb"`).
- `payment-config-form.dom.test.tsx` — RTL/jsdom coverage of both `kind`
  branches and the save flow.
- `actions.ts` — `saveConfigAction`: validates + persists the form via the
  vendor-scoped RLS client.
- `actions.test.ts` — unit coverage for both config kinds and validation
  failures.

## Parent

[dashboard](../README.md)

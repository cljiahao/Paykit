# config

## Purpose

`GET`/`POST /api/v1/vendors/{vendor_id}/config` — a calling kit reads a
vendor's full payment config (so it can pre-fill its own edit form on
re-open), or writes one on the vendor's behalf. Bearer-secret authenticated
(`verifyKitAuth`), service-role — not the vendor-session RLS path the
dashboard's own config form uses.

## Contents

- `route.ts` — `GET`: returns the full `vendor_payment_config` row —
  `{ has_config, display_name, kind, payee_name, uen, mobile, label, url,
qr_image_url }` — so a calling kit can pre-fill its own edit form; every
  field is `null`/`false` when no config exists yet. `POST`: validates the
  body against `vendorPaymentConfigInputSchema` (the same paynow|pointer
  schema the vendor dashboard's own config form uses) and upserts
  `vendor_payment_config` by `vendor_id`, letting a kit without its own
  vendor-session UI (e.g. a "quick add PayNow details" flow) write the
  config server-to-server.
- `route.test.ts` — covers both methods' auth/validation/upstream-failure
  paths and the full GET response shape for paynow, pointer, and
  unconfigured vendors.

## Parent

[vendors](../../README.md)

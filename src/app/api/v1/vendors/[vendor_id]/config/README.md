# config

## Purpose

`GET`/`POST /api/v1/vendors/{vendor_id}/config` — a calling kit reads
whether a vendor has a payment config set (without exposing the editable
fields), or writes one on the vendor's behalf. Bearer-secret authenticated
(`verifyKitAuth`), service-role — not the vendor-session RLS path the
dashboard's own config form uses.

## Contents

- `route.ts` — `GET`: returns `{ has_config, display_name }` only, never
  the raw `uen`/`mobile`/`url`/`qr_image_url` fields. `POST`: validates the
  body against `vendorPaymentConfigInputSchema` (the same paynow|pointer
  schema the vendor dashboard's own config form uses) and upserts
  `vendor_payment_config` by `vendor_id`, letting a kit without its own
  vendor-session UI (e.g. a "quick add PayNow details" flow) write the
  config server-to-server.
- `route.test.ts` — covers both methods' auth/validation/upstream-failure
  paths and the `has_config`/`display_name` response shape.

## Parent

[vendors](../../README.md)

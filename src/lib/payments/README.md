# payments

## Purpose

The two payment-method kinds vendors can configure, and how a checkout view
is derived from whichever kind is set. Neither file does I/O — both are pure
builders, kept that way since paykit never touches funds and there's nothing
to await here.

## Contents

- `paynow.ts` — `crc16` (CRC-16/CCITT-FALSE over UTF-8 bytes, matching what
  a QR scanner computes) and `buildPayNowPayload`: the EMVCo Merchant-
  Presented QR payload builder for PayNow. Ported verbatim from qkit's own
  `docs/superpowers/specs/2026-06-28-qkit-payments-seam-design.md` — do not
  fork the two copies without a reason.
- `adapter.ts` — `renderCheckout(config, ctx)`: given a
  `VendorPaymentConfig`, returns a `CheckoutView` discriminated on how the
  customer should pay — `{type:"qr"}` (built PayNow payload) for `kind:
"paynow"`, `{type:"link"}`/`{type:"image"}` for `kind: "pointer"`
  (whichever of `url`/`qr_image_url` is set). `autoVerify()` is a reserved-
  but-dark stub — throws unconditionally; do not wire it to a real
  provider (see root `AGENTS.md`).

## Connectivity

`renderCheckout` is called by the checkout route/page to build what the
customer sees. `buildPayNowPayload`/`crc16` are only reached through
`renderCheckout` for `kind: "paynow"`, but are exported directly for their
own unit tests.

## Parent

[lib](../README.md)

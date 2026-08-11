# test/contract

## Purpose

An HTTP-level contract test asserting the shape of paykit's `/api/v1/*`
responses stays stable for the kits calling it — mirrors merqo's
`qkit-metrics` contract-test precedent. Not RLS (see `test/db/`), not a
mock-only unit test (see `src/app/api/v1/**/route.test.ts`) — this asserts
the actual JSON wire shape a calling kit depends on.

## Contents

- `paykit-api.contract.test.ts` — checkout create/claim/confirm/status and
  the vendor-config `GET`/`POST` responses against their sample fixtures.
- `checkout-response.sample.json` — a saved example `POST /api/v1/checkout`
  response.
- `transaction-status.sample.json` — a saved example `GET /api/v1/checkout/{id}`
  response.
- `vendor-config.sample.json` — a saved example vendor-config response.

## Parent

See the repo root [README.md](../../README.md) for the full layout.

# paykit — Deploy Notes

paykit uses the shared Merqo Supabase project and owns the `paykit` schema.

## Deployment prerequisites

1. Expose `paykit` through the Data API. Apply pending Paykit migrations in
   order; follow the project `supabase-migrate` safety gate before any hosted
   database change. Do not rerun only the original core migration as an upgrade.
2. Apply the required Merqo shared profile, support, feedback and legal RPC
   migrations before deploying callers. The profile table belongs to
   `merqo.vendor_profile`; shared `vendor-images` Storage policies must also exist.
3. Configure the blank values listed in `.env.example`. Supabase service and
   cross-kit bearer secrets stay server-only. Metrics and provisioning secrets
   must be distinct; Merqo's outbound legal integration requires its base URL
   and customer secret so signed-in vendors can pass the legal gate.
4. Scope `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.merqo.io` to Production only. Leave it
   unset for localhost and `*.vercel.app` previews, where that domain cookie
   would be rejected. Rebuild after changing public environment values.
5. Register each real calling kit's API key using `scripts/create-kit-key.mjs`.
   Its default insert rejects an existing key; use `--rotate` only for an
   intentional coordinated replacement and update the caller's secret.

## Payment and rollout checks

qkit's checkout calls Paykit's HTTP API. Validate creation, customer claim/undo
and vendor confirmation with a local fixture before rollout. Unit mocks do not
prove RLS or migration behavior; run the focused SQL suites against a local
database as described in `supabase/tests/README.md`.

Paykit records payment state and refunds; vendors move funds through their own
payment method. Its default direct provider has no payment-provider webhook.
An enabled alternative provider requires its own documented setup.

Preview and Production deployment behavior should be verified independently;
this runbook does not establish which migrations or secrets are currently live.

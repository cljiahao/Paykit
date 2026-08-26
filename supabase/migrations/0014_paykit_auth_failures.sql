-- Every failed verifyKitAuth() call (kit-auth.ts) only ever console.warn'd —
-- zero durable visibility into a probing/brute-force pattern against the
-- bearer-secret /api/v1/* surface, notable given this repo's own
-- "highest security" framing. kit_slug is nullable: an unknown/malformed
-- attempt (missing header, unparseable token) has none to record. Same
-- shape as payment_audit/admin_audit: service-role-only, no RLS policies,
-- immutable from day one (grant-level UPDATE/DELETE never granted, rather
-- than granted-then-revoked as 0009/0011 had to do after the fact).
create table paykit.auth_failures (
  id         uuid primary key default gen_random_uuid(),
  kit_slug   text,
  reason     text not null,
  ip         text,
  created_at timestamptz not null default now()
);

create index auth_failures_created_idx on paykit.auth_failures (created_at desc);

alter table paykit.auth_failures enable row level security;
-- No policies: only the service-role client (verifyKitAuth's best-effort
-- write) ever touches this table.

grant select, insert on paykit.auth_failures to service_role;

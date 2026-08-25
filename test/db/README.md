# test/db

## Purpose

Cheap regex-presence guards against silent drift in the hand-written SQL
migrations — a fast sanity check, not a substitute for `supabase/tests/rls.test.sql`
(pgTAP against real Postgres, run in CI's `db` job).

## Contents

- `schema.test.ts` — asserts `0001_paykit_core.sql` creates the `paykit` schema and its core tables/RLS.
- `admin-schema.test.ts` — asserts `0006_paykit_admin.sql` creates `admins`/`is_admin`/`admin_audit` with RLS and the expected grants.
- `payment-audit-schema.test.ts` — asserts `0011_paykit_payment_audit.sql` creates `payment_audit` with RLS and the immutable-from-creation grant.
- `rate-limit-schema.test.ts` — asserts `0012_paykit_rate_limit.sql` creates `rate_limits`/`check_rate_limit()` with RLS, the cleanup index, and a service-role-only `EXECUTE` grant.

## Parent

See the repo root [README.md](../../README.md) for the full layout.

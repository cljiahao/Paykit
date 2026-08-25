-- Append-only audit trail for the payment-lifecycle API (checkout create/
-- claim/confirm/unclaim). `transactions.status` is a single column
-- overwritten on every transition — nothing today records what it used to
-- be, what triggered it, or when, so a disputed payment has no trail to
-- reconstruct from. This is the payment-lifecycle counterpart to
-- admin_audit (0006), kept as its own table rather than overloading
-- admin_audit's human-actor (admin_id NOT NULL references auth.users)
-- semantics — every writer here is a bearer-secret-authenticated kit
-- (kit-auth.ts), never a signed-in session. Same ownership shape as qkit's
-- order_status_events (0078): RLS admin-read-only + the transaction's own
-- vendor, service-role-write-only.
create table paykit.payment_audit (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references paykit.transactions(id) on delete cascade,
  kit_slug       text not null,
  action         text not null
    check (action in ('checkout_created', 'claimed', 'confirmed', 'unclaimed')),
  detail         jsonb,
  created_at     timestamptz not null default now()
);

create index payment_audit_transaction_idx on paykit.payment_audit (transaction_id, created_at desc);
create index payment_audit_created_idx on paykit.payment_audit (created_at desc);

alter table paykit.payment_audit enable row level security;

create policy payment_audit_vendor_select on paykit.payment_audit
  for select using (
    transaction_id in (
      select id from paykit.transactions where vendor_id = (select auth.uid())
    )
  );

create policy payment_audit_admin_select on paykit.payment_audit
  for select using (paykit.is_admin((select auth.uid())));

grant select on paykit.payment_audit to authenticated;
grant all on paykit.payment_audit to service_role;

-- Immutable at the grant level from day one (matching 0009's fast-follow
-- fix for admin_audit, applied here up front instead): the app only ever
-- INSERTs (recordPaymentAudit, src/lib/payment-audit.ts), so revoking
-- UPDATE/DELETE from service_role means even a compromised service-role key
-- can't rewrite payment history.
revoke update, delete on paykit.payment_audit from service_role;

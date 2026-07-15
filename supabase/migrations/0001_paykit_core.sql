create schema if not exists paykit;

create table paykit.vendor_payment_config (
  vendor_id           uuid primary key references auth.users(id) on delete cascade,
  uen                 text,
  mobile              text,
  payee_name          text not null,
  verification_method text not null default 'manual' check (verification_method in ('manual', 'auto')),
  plan                text not null default 'free' check (plan in ('free', 'pro')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint vendor_payment_config_one_proxy check (
    (uen is not null and mobile is null) or (uen is null and mobile is not null)
  )
);

create table paykit.transactions (
  id           uuid primary key default gen_random_uuid(),
  vendor_id    uuid not null references auth.users(id) on delete cascade,
  kit_slug     text not null,
  order_ref    text not null,
  amount_cents integer not null check (amount_cents > 0),
  status       text not null default 'pending' check (status in ('pending', 'claimed', 'confirmed')),
  qr_payload   text not null,
  claimed_at   timestamptz,
  confirmed_at timestamptz,
  created_at   timestamptz not null default now()
);
create index transactions_vendor_idx on paykit.transactions (vendor_id, created_at desc);
create index transactions_vendor_kit_idx on paykit.transactions (vendor_id, kit_slug);

create table paykit.refunds (
  id                    uuid primary key default gen_random_uuid(),
  transaction_id        uuid not null references paykit.transactions(id) on delete cascade,
  refunded_amount_cents integer not null check (refunded_amount_cents > 0),
  reason                text,
  created_by            uuid not null references auth.users(id),
  created_at            timestamptz not null default now()
);
create index refunds_transaction_idx on paykit.refunds (transaction_id);

create table paykit.kit_api_keys (
  kit_slug    text primary key,
  secret_hash text not null,
  created_at  timestamptz not null default now()
);

-- updated_at bookkeeping
create or replace function paykit.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger vendor_payment_config_set_updated_at
before update on paykit.vendor_payment_config
for each row execute function paykit.set_updated_at();

-- Free-tier usage: caller-scoped so an authenticated vendor can only ever
-- count their own transactions (SECURITY DEFINER would otherwise leak
-- another vendor's monthly count). service_role (no auth.uid()) is
-- unrestricted — the checkout API's own count query goes through the
-- service client directly, but the vendor dashboard's usage meter calls
-- this RPC as the signed-in vendor.
create or replace function paykit.tx_count_this_month(p_vendor uuid)
returns integer language plpgsql security definer stable set search_path = '' as $$
begin
  if auth.uid() is not null and auth.uid() <> p_vendor then
    raise exception 'not authorized';
  end if;
  return (
    select count(*)::int from paykit.transactions
    where vendor_id = p_vendor
      and created_at >= date_trunc('month', now())
  );
end;
$$;

-- RLS
alter table paykit.vendor_payment_config enable row level security;
alter table paykit.transactions enable row level security;
alter table paykit.refunds enable row level security;
alter table paykit.kit_api_keys enable row level security;

create policy vendor_payment_config_own on paykit.vendor_payment_config
  for all
  using (vendor_id = (select auth.uid()))
  with check (vendor_id = (select auth.uid()));

create policy transactions_select_own on paykit.transactions
  for select
  using (vendor_id = (select auth.uid()));

create policy refunds_select_own on paykit.refunds
  for select
  using (
    exists (
      select 1 from paykit.transactions t
      where t.id = transaction_id and t.vendor_id = (select auth.uid())
    )
  );

-- A refund may only be filed by the owning vendor, against their own
-- CONFIRMED transaction, while on Pro (refunds are a Pro-only bookkeeping
-- feature per the design spec).
create policy refunds_insert_own on paykit.refunds
  for insert
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from paykit.transactions t
      join paykit.vendor_payment_config c on c.vendor_id = t.vendor_id
      where t.id = transaction_id
        and t.vendor_id = (select auth.uid())
        and t.status = 'confirmed'
        and c.plan = 'pro'
    )
  );

-- kit_api_keys carries NO policy at all: only service_role (which bypasses
-- RLS) may ever touch it. No grants below give authenticated/anon any access.

grant usage on schema paykit to anon, authenticated, service_role;
grant select, insert, update, delete on paykit.vendor_payment_config to authenticated;
grant select on paykit.transactions to authenticated;
grant select, insert on paykit.refunds to authenticated;
grant all on all tables in schema paykit to service_role;
grant execute on function paykit.tx_count_this_month(uuid) to authenticated, service_role;

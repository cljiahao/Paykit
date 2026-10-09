-- Serialize refund accounting on the immutable checkout row. A real parent
-- write also prevents a stale repeatable-read snapshot from admitting two refunds.
create function paykit.enforce_refund_total()
returns trigger
language plpgsql volatile security definer set search_path = '' as $$
declare
  caller_role text := coalesce(pg_catalog.current_setting('role', true), 'unknown');
  checkout_amount integer;
  checkout_status text;
  refunded_total bigint;
  previous_refund_id uuid;
begin
  if tg_op = 'UPDATE' and
    row(new.id, new.transaction_id, new.created_by, new.created_at)
      is distinct from row(old.id, old.transaction_id, old.created_by, old.created_at) then
    raise exception 'refund identity is immutable' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' then
    previous_refund_id := old.id;
  end if;

  -- Check ownership before a privileged lock or amount lookup can disclose
  -- anything about another vendor's checkout. RLS still enforces the insert.
  if caller_role not in ('none', 'postgres', 'service_role') then
    if caller_role <> 'authenticated' or auth.uid() is null
      or new.created_by is distinct from auth.uid()
      or not exists (
        select 1 from paykit.transactions t
        join paykit.vendor_payment_config c on c.vendor_id = t.vendor_id
        where t.id = new.transaction_id and t.vendor_id = auth.uid()
          and t.status = 'confirmed' and c.plan = 'pro'
      ) then
      raise exception 'refund not authorized' using errcode = '42501';
    end if;
  end if;

  update paykit.transactions set id = id
  where id = new.transaction_id
  returning amount_cents, status into checkout_amount, checkout_status;
  if not found then
    raise exception 'refund checkout missing' using errcode = '23503';
  end if;
  if checkout_status <> 'confirmed' then
    raise exception 'refund requires a confirmed checkout' using errcode = '23514';
  end if;

  select coalesce(sum(r.refunded_amount_cents::bigint), 0)
    into refunded_total from paykit.refunds r
    where r.transaction_id = new.transaction_id
      and (previous_refund_id is null or r.id <> previous_refund_id);
  if refunded_total + new.refunded_amount_cents::bigint > checkout_amount::bigint then
    raise exception 'refund total exceeds checkout amount' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function paykit.enforce_refund_total() from public, anon, authenticated, service_role;
create trigger refunds_enforce_total before insert or update on paykit.refunds
for each row execute function paykit.enforce_refund_total();

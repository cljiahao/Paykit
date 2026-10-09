-- Match confirmation's transaction-before-booking lock order.
create or replace function paykit.link_booking_balance(
  p_booking_id uuid, p_vendor_id uuid, p_transaction_id uuid
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  t paykit.transactions%rowtype;
  b paykit.bookings%rowtype;
  v_deposit_id uuid;
  v_deposit_confirmed boolean := false;
begin
  select deposit_transaction_id into v_deposit_id from paykit.bookings
  where id = p_booking_id and vendor_id = p_vendor_id;
  perform id from paykit.transactions
  where id = p_transaction_id or id = v_deposit_id
  order by id for update;
  select * into t from paykit.transactions where id = p_transaction_id;
  select * into b from paykit.bookings where id = p_booking_id for update;
  if b.id is null or b.vendor_id is distinct from p_vendor_id or b.status = 'cancelled' then
    raise exception 'invalid booking';
  end if;
  if b.deposit_transaction_id is distinct from v_deposit_id then
    raise exception 'booking changed; retry';
  end if;
  if v_deposit_id is null then raise exception 'deposit required'; end if;
  if t.id is null or t.vendor_id <> b.vendor_id or t.kit_slug <> 'paykit'
    or t.order_ref <> 'booking:' || b.id::text || ':balance'
    or t.amount_cents <> b.balance_amount_cents then
    raise exception 'invalid balance transaction';
  end if;
  if b.balance_transaction_id is not null and b.balance_transaction_id <> t.id then
    raise exception 'balance already linked';
  end if;
  select status = 'confirmed' into v_deposit_confirmed from paykit.transactions
  where id = v_deposit_id and vendor_id = b.vendor_id;
  update paykit.bookings set balance_transaction_id = t.id,
    status = case
      when t.status = 'confirmed' and v_deposit_confirmed then 'fully_paid'
      when v_deposit_confirmed and b.status = 'pending_deposit' then 'deposit_paid'
      else b.status
    end
  where id = b.id;
  return b.id;
end;
$$;
revoke all on function paykit.link_booking_balance(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function paykit.link_booking_balance(uuid,uuid,uuid) to service_role;

-- Serialize booking reconciliation before reading both payment states.
create or replace function paykit.sync_booking_status()
returns trigger language plpgsql as $$
declare
  b paykit.bookings%rowtype;
  deposit_confirmed boolean;
  balance_confirmed boolean;
begin
  if new.status <> 'confirmed' then
    return new;
  end if;

  for b in
    select * from paykit.bookings
    where (deposit_transaction_id = new.id or balance_transaction_id = new.id)
      and status <> 'cancelled'
    order by id for update
  loop
    deposit_confirmed := exists (
      select 1 from paykit.transactions t
      where t.id = b.deposit_transaction_id and t.status = 'confirmed'
    );
    balance_confirmed := b.balance_transaction_id is not null and exists (
      select 1 from paykit.transactions t
      where t.id = b.balance_transaction_id and t.status = 'confirmed'
    );

    if deposit_confirmed and balance_confirmed then
      update paykit.bookings set status = 'fully_paid'
      where id = b.id and status <> 'cancelled';
    elsif deposit_confirmed then
      update paykit.bookings set status = 'deposit_paid'
      where id = b.id and status = 'pending_deposit';
    end if;
  end loop;

  return new;
end;
$$;

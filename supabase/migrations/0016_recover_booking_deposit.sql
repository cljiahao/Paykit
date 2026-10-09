-- Lock every referenced payment before the booking, matching confirmation's lock order.
create or replace function paykit.link_booking_deposit(
  p_booking_id uuid, p_vendor_id uuid, p_transaction_id uuid
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  t paykit.transactions%rowtype;
  b paykit.bookings%rowtype;
  v_balance_id uuid;
  v_balance_confirmed boolean := false;
begin
  select balance_transaction_id into v_balance_id from paykit.bookings
  where id = p_booking_id and vendor_id = p_vendor_id;
  perform id from paykit.transactions
  where id = p_transaction_id or id = v_balance_id
  order by id for update;
  select * into t from paykit.transactions where id = p_transaction_id;
  select * into b from paykit.bookings where id = p_booking_id for update;
  if b.id is null or b.vendor_id is distinct from p_vendor_id or b.status = 'cancelled' then
    raise exception 'invalid booking';
  end if;
  if b.balance_transaction_id is distinct from v_balance_id then
    raise exception 'booking changed; retry';
  end if;
  if t.id is null or t.vendor_id <> b.vendor_id or t.kit_slug <> 'paykit'
    or t.order_ref <> 'booking:' || b.id::text || ':deposit'
    or t.amount_cents <> b.deposit_amount_cents then
    raise exception 'invalid deposit transaction';
  end if;
  if b.deposit_transaction_id is not null and b.deposit_transaction_id <> t.id then
    raise exception 'deposit already linked';
  end if;
  if v_balance_id is not null then
    select status = 'confirmed' into v_balance_confirmed from paykit.transactions
    where id = v_balance_id and vendor_id = b.vendor_id;
  end if;
  update paykit.bookings set deposit_transaction_id = t.id,
    status = case
      when t.status = 'confirmed' and v_balance_confirmed then 'fully_paid'
      when t.status = 'confirmed' and b.status = 'pending_deposit' then 'deposit_paid'
      else b.status
    end
  where id = b.id;
  return b.id;
end;
$$;
revoke all on function paykit.link_booking_deposit(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function paykit.link_booking_deposit(uuid,uuid,uuid) to service_role;

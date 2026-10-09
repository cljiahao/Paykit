-- The default PUBLIC function grant bypassed the trusted HTTP caller boundary.
create or replace function paykit.check_rate_limit(
  p_key text, p_limit int, p_window_seconds int
)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_window timestamptz;
  v_count int;
begin
  if p_key is null or pg_catalog.length(p_key) not between 1 and 255
     or p_limit is null or p_limit not between 1 and 100000
     or p_window_seconds is null or p_window_seconds not between 1 and 86400 then
    raise exception 'invalid rate limit parameters' using errcode = '22023';
  end if;

  v_window := pg_catalog.to_timestamp(
    pg_catalog.floor(extract(epoch from pg_catalog.now()) / p_window_seconds) * p_window_seconds
  );
  insert into paykit.rate_limits (key, window_start, count)
    values (p_key, v_window, 1)
    on conflict (key, window_start) do update
      set count = least(paykit.rate_limits.count::bigint + 1, 2147483647)::int
    returning count into v_count;

  -- Retain every supported window, including the longest allowed daily window.
  if pg_catalog.random() < 0.02 then
    delete from paykit.rate_limits
      where window_start < pg_catalog.now() - interval '1 day';
  end if;
  return v_count <= p_limit;
end;
$$;
revoke execute on function paykit.check_rate_limit(text, int, int)
  from public, anon, authenticated;
grant execute on function paykit.check_rate_limit(text, int, int) to service_role;

-- Application audit consumers only append/read; owners retain schema privileges.
revoke update, delete, truncate, references, trigger
  on paykit.admin_audit, paykit.payment_audit from service_role;
grant select, insert on paykit.admin_audit, paykit.payment_audit to service_role;

-- DB-backed fixed-window rate limiter (no external infra), ported from
-- qkit's own `0017_rate_limit.sql`/`0036_rate_limit_cleanup.sql`. Closes a
-- real gap: paykit's bearer-secret `/api/v1/*` surface had no throttling at
-- all — a leaked or misbehaving kit secret could hammer any endpoint
-- unbounded. check_rate_limit atomically counts hits for the current window
-- and returns false once the limit is exceeded. SECURITY DEFINER; only the
-- app's own route handlers (via the service-role client) call this —
-- paykit's `/api/v1/*` surface is server-to-server, never a browser-facing
-- anon/authenticated caller, so EXECUTE is granted to service_role only
-- (unlike qkit's anon/authenticated grant, which backs a client-callable
-- RPC).
create table paykit.rate_limits (
  key          text        not null,
  window_start timestamptz not null,
  count        int         not null default 0,
  primary key (key, window_start)
);

create index rate_limits_window_start_idx on paykit.rate_limits (window_start);

alter table paykit.rate_limits enable row level security;
-- No policies: only the SECURITY DEFINER function (and service role) touch it.

create or replace function paykit.check_rate_limit(
  p_key text,
  p_limit int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = paykit
as $$
declare
  v_window timestamptz;
  v_count  int;
begin
  -- Floor now() to the start of the current fixed window.
  v_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into paykit.rate_limits (key, window_start, count)
    values (p_key, v_window, 1)
    on conflict (key, window_start)
    do update set count = paykit.rate_limits.count + 1
    returning count into v_count;

  -- Probabilistic cleanup (~2% of calls, index-backed) instead of an
  -- unindexed DELETE on every call — same fix qkit's own 0036 applied after
  -- finding the naive version cost a full scan on every hot-path call.
  if random() < 0.02 then
    delete from paykit.rate_limits
      where window_start < now() - interval '1 hour';
  end if;

  return v_count <= p_limit;
end;
$$;

grant execute on function paykit.check_rate_limit(text, int, int) to service_role;

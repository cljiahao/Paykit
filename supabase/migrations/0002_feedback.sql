create table paykit.feedback (
  id bigint generated always as identity primary key,
  vendor_id uuid not null references auth.users(id) on delete cascade,
  nps smallint not null check (nps between 0 and 10),
  message text,
  created_at timestamptz not null default now()
);

alter table paykit.feedback enable row level security;

create policy feedback_self_insert on paykit.feedback
  for insert
  to authenticated
  with check (vendor_id = auth.uid());

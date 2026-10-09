-- Historical payloads cannot distinguish a link from a QR image URL.
-- Leave their display kind unknown; never infer it from mutable vendor config.
alter table paykit.transactions
  add column checkout_kind text,
  add column checkout_label text,
  add constraint transactions_checkout_kind_check check (checkout_kind in ('qr', 'link', 'image')),
  add constraint transactions_checkout_label_check check (
    case when checkout_kind = 'link' then checkout_label is not null
    else checkout_label is null end
  );

create function paykit.protect_checkout_snapshot()
returns trigger language plpgsql set search_path = '' as $$
begin
  if row(new.vendor_id,new.kit_slug,new.order_ref,new.amount_cents,new.qr_payload,new.checkout_kind,new.checkout_label)
    is distinct from row(old.vendor_id,old.kit_slug,old.order_ref,old.amount_cents,old.qr_payload,old.checkout_kind,old.checkout_label) then
    raise exception 'checkout snapshot is immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function paykit.protect_checkout_snapshot() from public, anon, authenticated;
create trigger protect_checkout_snapshot before update on paykit.transactions
for each row execute function paykit.protect_checkout_snapshot();

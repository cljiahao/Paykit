# PostgreSQL isolationtester specification; not a pgTAP test.
# Each permutation must admit only one 600-cent refund of a 1000-cent checkout.
# READ COMMITTED rejects the second insert with 23514; REPEATABLE READ rejects
# its conflicting parent write with 40001. Run against a disposable database.
setup
{
  insert into auth.users(id,instance_id,aud,role,email) values
    ('a0200000-0000-0000-0000-000000000099','00000000-0000-0000-0000-000000000000','authenticated','authenticated','refund-race@test.local');
  insert into paykit.transactions(id,vendor_id,kit_slug,order_ref,amount_cents,status,qr_payload)
    values('b0200000-0000-0000-0000-000000000099','a0200000-0000-0000-0000-000000000099','qkit','refund-race',1000,'confirmed','race-fixture');
}
teardown
{
  delete from paykit.transactions where id='b0200000-0000-0000-0000-000000000099';
  delete from auth.users where id='a0200000-0000-0000-0000-000000000099';
}
session "first"
step "first_rc" { begin isolation level read committed; }
step "first_rr" { begin isolation level repeatable read; }
step "first_snapshot" { select count(*) from paykit.refunds; }
step "first_refund"
{
  insert into paykit.refunds(transaction_id,refunded_amount_cents,created_by)
    values('b0200000-0000-0000-0000-000000000099',600,'a0200000-0000-0000-0000-000000000099');
}
step "first_commit" { commit; }
session "second"
step "second_rc" { begin isolation level read committed; }
step "second_rr" { begin isolation level repeatable read; }
step "second_snapshot" { select count(*) from paykit.refunds; }
step "second_refund"
{
  insert into paykit.refunds(transaction_id,refunded_amount_cents,created_by)
    values('b0200000-0000-0000-0000-000000000099',600,'a0200000-0000-0000-0000-000000000099');
}
step "second_commit" { commit; }
step "total" { select sum(refunded_amount_cents) from paykit.refunds where transaction_id='b0200000-0000-0000-0000-000000000099'; }
permutation "first_rc" "second_rc" "first_refund" "second_refund" "first_commit" "second_commit" "total"
permutation "first_rr" "second_rr" "first_snapshot" "second_snapshot" "first_refund" "second_refund" "first_commit" "second_commit" "total"

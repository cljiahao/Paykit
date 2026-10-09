begin;
select no_plan();
select ok(not has_function_privilege('anon', 'paykit.link_booking_deposit(uuid,uuid,uuid)', 'execute'), 'anonymous callers cannot link payments');
select ok(not has_function_privilege('authenticated', 'paykit.link_booking_deposit(uuid,uuid,uuid)', 'execute'), 'vendors cannot bypass server validation');
select ok(has_function_privilege('service_role', 'paykit.link_booking_deposit(uuid,uuid,uuid)', 'execute'), 'trusted server can recover deposits');
insert into auth.users (id, instance_id, aud, role, email) values
('00160000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','link-a@test.local'),
('00160000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','link-b@test.local');
insert into paykit.bookings (id,vendor_id,customer_name,event_date,total_amount_cents,deposit_amount_cents,balance_amount_cents,balance_due_date)
select ('00160000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,
'00160000-0000-0000-0000-000000000001','Audit booking',current_date+30,300,100,200,current_date+20
from generate_series(101,108) n;
insert into paykit.transactions (id,vendor_id,kit_slug,order_ref,amount_cents,status,qr_payload)
select ('00160000-0000-0000-0000-'||lpad((n+100)::text,12,'0'))::uuid,
case when n=105 then '00160000-0000-0000-0000-000000000002'::uuid else '00160000-0000-0000-0000-000000000001'::uuid end,
case when n=106 then 'qkit' else 'paykit' end,
case when n=107 then 'wrong-reference' else 'booking:00160000-0000-0000-0000-'||lpad(n::text,12,'0')||':deposit' end,
case when n=104 then 101 else 100 end,
case when n=102 then 'confirmed' else 'pending' end,'payload'
from generate_series(101,108) n;
insert into paykit.transactions (id,vendor_id,kit_slug,order_ref,amount_cents,status,qr_payload) values
('00160000-0000-0000-0000-000000000302','00160000-0000-0000-0000-000000000001','paykit','booking:00160000-0000-0000-0000-000000000102:balance',200,'confirmed','payload'),
('00160000-0000-0000-0000-000000000308','00160000-0000-0000-0000-000000000001','paykit','historical-other-deposit',100,'pending','payload');
update paykit.bookings set balance_transaction_id='00160000-0000-0000-0000-000000000302' where id='00160000-0000-0000-0000-000000000102';
update paykit.bookings set status='cancelled' where id='00160000-0000-0000-0000-000000000103';
update paykit.bookings set deposit_transaction_id='00160000-0000-0000-0000-000000000308' where id='00160000-0000-0000-0000-000000000108';
set local role service_role;
select is(paykit.link_booking_deposit('00160000-0000-0000-0000-000000000101','00160000-0000-0000-0000-000000000001','00160000-0000-0000-0000-000000000201'),'00160000-0000-0000-0000-000000000101'::uuid,'links the original pending checkout');
select is(paykit.link_booking_deposit('00160000-0000-0000-0000-000000000101','00160000-0000-0000-0000-000000000001','00160000-0000-0000-0000-000000000201'),'00160000-0000-0000-0000-000000000101'::uuid,'same payment retry is idempotent');
select is((select status from paykit.bookings where id='00160000-0000-0000-0000-000000000101'),'pending_deposit','pending payment does not imply paid');
update paykit.transactions set status='confirmed' where id='00160000-0000-0000-0000-000000000201';
select is((select status from paykit.bookings where id='00160000-0000-0000-0000-000000000101'),'deposit_paid','later confirmation synchronizes the recovered booking');
select lives_ok($$select paykit.link_booking_deposit('00160000-0000-0000-0000-000000000102','00160000-0000-0000-0000-000000000001','00160000-0000-0000-0000-000000000202')$$,'relinks a checkout confirmed before recovery');
select is((select status from paykit.bookings where id='00160000-0000-0000-0000-000000000102'),'fully_paid','already confirmed deposit and balance reconcile to fully paid');
select throws_ok($$select paykit.link_booking_deposit('00160000-0000-0000-0000-000000000103','00160000-0000-0000-0000-000000000001','00160000-0000-0000-0000-000000000203')$$,'P0001','invalid booking','cancelled booking cannot be reopened');
select throws_ok($$select paykit.link_booking_deposit('00160000-0000-0000-0000-000000000101','00160000-0000-0000-0000-000000000002','00160000-0000-0000-0000-000000000201')$$,'P0001','invalid booking','wrong vendor cannot link another booking');
select throws_ok($$select paykit.link_booking_deposit('00160000-0000-0000-0000-000000000104','00160000-0000-0000-0000-000000000001','00160000-0000-0000-0000-000000000204')$$,'P0001','invalid deposit transaction','deposit amount must match');
select throws_ok($$select paykit.link_booking_deposit('00160000-0000-0000-0000-000000000105','00160000-0000-0000-0000-000000000001','00160000-0000-0000-0000-000000000205')$$,'P0001','invalid deposit transaction','transaction vendor must match');
select throws_ok($$select paykit.link_booking_deposit('00160000-0000-0000-0000-000000000106','00160000-0000-0000-0000-000000000001','00160000-0000-0000-0000-000000000206')$$,'P0001','invalid deposit transaction','transaction kit must match');
select throws_ok($$select paykit.link_booking_deposit('00160000-0000-0000-0000-000000000107','00160000-0000-0000-0000-000000000001','00160000-0000-0000-0000-000000000207')$$,'P0001','invalid deposit transaction','transaction order reference must match');
select throws_ok($$select paykit.link_booking_deposit('00160000-0000-0000-0000-000000000108','00160000-0000-0000-0000-000000000001','00160000-0000-0000-0000-000000000208')$$,'P0001','deposit already linked','a linked checkout cannot be replaced');
reset role;
select * from finish();
rollback;

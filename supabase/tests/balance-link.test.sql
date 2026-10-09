begin;
select no_plan();
select ok(not has_function_privilege('anon','paykit.link_booking_balance(uuid,uuid,uuid)','execute'),'anon cannot link balances');
select ok(not has_function_privilege('authenticated','paykit.link_booking_balance(uuid,uuid,uuid)','execute'),'authenticated cannot bypass server');
select ok(has_function_privilege('service_role','paykit.link_booking_balance(uuid,uuid,uuid)','execute'),'service may link balances');
insert into auth.users(id,instance_id,aud,role,email) values
('00170000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','balance-a@test.local'),
('00170000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','balance-b@test.local');
insert into paykit.bookings(id,vendor_id,customer_name,event_date,total_amount_cents,deposit_amount_cents,balance_amount_cents,balance_due_date) values ('00170000-0000-0000-0000-000000000101','00170000-0000-0000-0000-000000000001','Balance audit',current_date+30,300,100,200,current_date+20);
insert into paykit.transactions(id,vendor_id,kit_slug,order_ref,amount_cents,status,qr_payload) values
('00170000-0000-0000-0000-000000000301','00170000-0000-0000-0000-000000000001','paykit','booking:00170000-0000-0000-0000-000000000101:deposit',100,'confirmed','payload'),
('00170000-0000-0000-0000-000000000201','00170000-0000-0000-0000-000000000001','paykit','booking:00170000-0000-0000-0000-000000000101:balance',200,'pending','payload');
update paykit.bookings set deposit_transaction_id='00170000-0000-0000-0000-000000000301' where id='00170000-0000-0000-0000-000000000101';
insert into paykit.bookings(id,vendor_id,customer_name,event_date,total_amount_cents,deposit_amount_cents,balance_amount_cents,balance_due_date) values ('00170000-0000-0000-0000-000000000102','00170000-0000-0000-0000-000000000001','Balance audit',current_date+30,300,100,200,current_date+20);
insert into paykit.transactions(id,vendor_id,kit_slug,order_ref,amount_cents,status,qr_payload) values
('00170000-0000-0000-0000-000000000302','00170000-0000-0000-0000-000000000001','paykit','booking:00170000-0000-0000-0000-000000000102:deposit',100,'confirmed','payload'),
('00170000-0000-0000-0000-000000000202','00170000-0000-0000-0000-000000000001','paykit','booking:00170000-0000-0000-0000-000000000102:balance',200,'confirmed','payload');
update paykit.bookings set deposit_transaction_id='00170000-0000-0000-0000-000000000302' where id='00170000-0000-0000-0000-000000000102';
insert into paykit.bookings(id,vendor_id,customer_name,event_date,total_amount_cents,deposit_amount_cents,balance_amount_cents,balance_due_date) values ('00170000-0000-0000-0000-000000000103','00170000-0000-0000-0000-000000000001','Balance audit',current_date+30,300,100,200,current_date+20);
insert into paykit.transactions(id,vendor_id,kit_slug,order_ref,amount_cents,status,qr_payload) values
('00170000-0000-0000-0000-000000000303','00170000-0000-0000-0000-000000000001','paykit','booking:00170000-0000-0000-0000-000000000103:deposit',100,'confirmed','payload'),
('00170000-0000-0000-0000-000000000203','00170000-0000-0000-0000-000000000001','paykit','booking:00170000-0000-0000-0000-000000000103:balance',200,'pending','payload');
update paykit.bookings set deposit_transaction_id='00170000-0000-0000-0000-000000000303' where id='00170000-0000-0000-0000-000000000103';
insert into paykit.bookings(id,vendor_id,customer_name,event_date,total_amount_cents,deposit_amount_cents,balance_amount_cents,balance_due_date) values ('00170000-0000-0000-0000-000000000104','00170000-0000-0000-0000-000000000001','Balance audit',current_date+30,300,100,200,current_date+20);
insert into paykit.transactions(id,vendor_id,kit_slug,order_ref,amount_cents,status,qr_payload) values
('00170000-0000-0000-0000-000000000304','00170000-0000-0000-0000-000000000001','paykit','booking:00170000-0000-0000-0000-000000000104:deposit',100,'confirmed','payload'),
('00170000-0000-0000-0000-000000000204','00170000-0000-0000-0000-000000000001','paykit','booking:00170000-0000-0000-0000-000000000104:balance',201,'pending','payload');
update paykit.bookings set deposit_transaction_id='00170000-0000-0000-0000-000000000304' where id='00170000-0000-0000-0000-000000000104';
insert into paykit.bookings(id,vendor_id,customer_name,event_date,total_amount_cents,deposit_amount_cents,balance_amount_cents,balance_due_date) values ('00170000-0000-0000-0000-000000000105','00170000-0000-0000-0000-000000000001','Balance audit',current_date+30,300,100,200,current_date+20);
insert into paykit.transactions(id,vendor_id,kit_slug,order_ref,amount_cents,status,qr_payload) values
('00170000-0000-0000-0000-000000000305','00170000-0000-0000-0000-000000000001','paykit','booking:00170000-0000-0000-0000-000000000105:deposit',100,'confirmed','payload'),
('00170000-0000-0000-0000-000000000205','00170000-0000-0000-0000-000000000002','paykit','booking:00170000-0000-0000-0000-000000000105:balance',200,'pending','payload');
update paykit.bookings set deposit_transaction_id='00170000-0000-0000-0000-000000000305' where id='00170000-0000-0000-0000-000000000105';
insert into paykit.bookings(id,vendor_id,customer_name,event_date,total_amount_cents,deposit_amount_cents,balance_amount_cents,balance_due_date) values ('00170000-0000-0000-0000-000000000106','00170000-0000-0000-0000-000000000001','Balance audit',current_date+30,300,100,200,current_date+20);
insert into paykit.transactions(id,vendor_id,kit_slug,order_ref,amount_cents,status,qr_payload) values
('00170000-0000-0000-0000-000000000306','00170000-0000-0000-0000-000000000001','paykit','booking:00170000-0000-0000-0000-000000000106:deposit',100,'confirmed','payload'),
('00170000-0000-0000-0000-000000000206','00170000-0000-0000-0000-000000000001','qkit','booking:00170000-0000-0000-0000-000000000106:balance',200,'pending','payload');
update paykit.bookings set deposit_transaction_id='00170000-0000-0000-0000-000000000306' where id='00170000-0000-0000-0000-000000000106';
insert into paykit.bookings(id,vendor_id,customer_name,event_date,total_amount_cents,deposit_amount_cents,balance_amount_cents,balance_due_date) values ('00170000-0000-0000-0000-000000000107','00170000-0000-0000-0000-000000000001','Balance audit',current_date+30,300,100,200,current_date+20);
insert into paykit.transactions(id,vendor_id,kit_slug,order_ref,amount_cents,status,qr_payload) values
('00170000-0000-0000-0000-000000000307','00170000-0000-0000-0000-000000000001','paykit','booking:00170000-0000-0000-0000-000000000107:deposit',100,'confirmed','payload'),
('00170000-0000-0000-0000-000000000207','00170000-0000-0000-0000-000000000001','paykit','wrong-reference',200,'pending','payload');
update paykit.bookings set deposit_transaction_id='00170000-0000-0000-0000-000000000307' where id='00170000-0000-0000-0000-000000000107';
insert into paykit.bookings(id,vendor_id,customer_name,event_date,total_amount_cents,deposit_amount_cents,balance_amount_cents,balance_due_date) values ('00170000-0000-0000-0000-000000000108','00170000-0000-0000-0000-000000000001','Balance audit',current_date+30,300,100,200,current_date+20);
insert into paykit.transactions(id,vendor_id,kit_slug,order_ref,amount_cents,status,qr_payload) values
('00170000-0000-0000-0000-000000000308','00170000-0000-0000-0000-000000000001','paykit','booking:00170000-0000-0000-0000-000000000108:deposit',100,'confirmed','payload'),
('00170000-0000-0000-0000-000000000208','00170000-0000-0000-0000-000000000001','paykit','booking:00170000-0000-0000-0000-000000000108:balance',200,'pending','payload');
update paykit.bookings set deposit_transaction_id='00170000-0000-0000-0000-000000000308' where id='00170000-0000-0000-0000-000000000108';
insert into paykit.bookings(id,vendor_id,customer_name,event_date,total_amount_cents,deposit_amount_cents,balance_amount_cents,balance_due_date) values ('00170000-0000-0000-0000-000000000109','00170000-0000-0000-0000-000000000001','Balance audit',current_date+30,300,100,200,current_date+20);
insert into paykit.transactions(id,vendor_id,kit_slug,order_ref,amount_cents,status,qr_payload) values
('00170000-0000-0000-0000-000000000309','00170000-0000-0000-0000-000000000001','paykit','booking:00170000-0000-0000-0000-000000000109:deposit',100,'confirmed','payload'),
('00170000-0000-0000-0000-000000000209','00170000-0000-0000-0000-000000000001','paykit','booking:00170000-0000-0000-0000-000000000109:balance',200,'pending','payload');
update paykit.bookings set status='cancelled' where id='00170000-0000-0000-0000-000000000103';
insert into paykit.transactions(id,vendor_id,kit_slug,order_ref,amount_cents,status,qr_payload) values ('00170000-0000-0000-0000-000000000408','00170000-0000-0000-0000-000000000001','paykit','historical-balance',200,'pending','payload');
update paykit.bookings set balance_transaction_id='00170000-0000-0000-0000-000000000408' where id='00170000-0000-0000-0000-000000000108';
set local role service_role;
select is(paykit.link_booking_balance('00170000-0000-0000-0000-000000000101','00170000-0000-0000-0000-000000000001','00170000-0000-0000-0000-000000000201'),'00170000-0000-0000-0000-000000000101'::uuid,'links pending balance');
select is(paykit.link_booking_balance('00170000-0000-0000-0000-000000000101','00170000-0000-0000-0000-000000000001','00170000-0000-0000-0000-000000000201'),'00170000-0000-0000-0000-000000000101'::uuid,'same balance retry is idempotent');
select is((select status from paykit.bookings where id='00170000-0000-0000-0000-000000000101'),'deposit_paid','reconciles confirmed deposit without marking pending balance paid');
update paykit.transactions set status='confirmed' where id='00170000-0000-0000-0000-000000000201';
select is((select status from paykit.bookings where id='00170000-0000-0000-0000-000000000101'),'fully_paid','later balance confirmation updates booking');
select lives_ok($$select paykit.link_booking_balance('00170000-0000-0000-0000-000000000102','00170000-0000-0000-0000-000000000001','00170000-0000-0000-0000-000000000202')$$,'links balance already confirmed before link');
select is((select status from paykit.bookings where id='00170000-0000-0000-0000-000000000102'),'fully_paid','reconciles both confirmed payments');
select throws_ok($$select paykit.link_booking_balance('00170000-0000-0000-0000-000000000103','00170000-0000-0000-0000-000000000001','00170000-0000-0000-0000-000000000203')$$,'P0001','invalid booking','rejects invalid balance fixture 103');
select throws_ok($$select paykit.link_booking_balance('00170000-0000-0000-0000-000000000104','00170000-0000-0000-0000-000000000001','00170000-0000-0000-0000-000000000204')$$,'P0001','invalid balance transaction','rejects invalid balance fixture 104');
select throws_ok($$select paykit.link_booking_balance('00170000-0000-0000-0000-000000000105','00170000-0000-0000-0000-000000000001','00170000-0000-0000-0000-000000000205')$$,'P0001','invalid balance transaction','rejects invalid balance fixture 105');
select throws_ok($$select paykit.link_booking_balance('00170000-0000-0000-0000-000000000106','00170000-0000-0000-0000-000000000001','00170000-0000-0000-0000-000000000206')$$,'P0001','invalid balance transaction','rejects invalid balance fixture 106');
select throws_ok($$select paykit.link_booking_balance('00170000-0000-0000-0000-000000000107','00170000-0000-0000-0000-000000000001','00170000-0000-0000-0000-000000000207')$$,'P0001','invalid balance transaction','rejects invalid balance fixture 107');
select throws_ok($$select paykit.link_booking_balance('00170000-0000-0000-0000-000000000108','00170000-0000-0000-0000-000000000001','00170000-0000-0000-0000-000000000208')$$,'P0001','balance already linked','rejects invalid balance fixture 108');
select throws_ok($$select paykit.link_booking_balance('00170000-0000-0000-0000-000000000109','00170000-0000-0000-0000-000000000001','00170000-0000-0000-0000-000000000209')$$,'P0001','deposit required','rejects invalid balance fixture 109');
select throws_ok($$select paykit.link_booking_balance('00170000-0000-0000-0000-000000000101','00170000-0000-0000-0000-000000000002','00170000-0000-0000-0000-000000000201')$$,'P0001','invalid booking','wrong vendor denied');
reset role;
select * from finish();
rollback;

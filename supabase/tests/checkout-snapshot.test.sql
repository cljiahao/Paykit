begin;
select no_plan();
insert into auth.users(id,instance_id,aud,role,email) values('00180000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','snapshot@test.local');
insert into paykit.transactions(id,vendor_id,kit_slug,order_ref,amount_cents,qr_payload,checkout_kind,checkout_label) values
('00180000-0000-0000-0000-000000000002','00180000-0000-0000-0000-000000000001','paykit','snapshot-link',100,'https://pay.example/link','link','Original');
select throws_ok($$insert into paykit.transactions(vendor_id,kit_slug,order_ref,amount_cents,qr_payload,checkout_kind) values('00180000-0000-0000-0000-000000000001','paykit','invalid-kind',100,'payload','html')$$,'23514',null,'unknown checkout kind rejected');
select throws_ok($$insert into paykit.transactions(vendor_id,kit_slug,order_ref,amount_cents,qr_payload,checkout_kind) values('00180000-0000-0000-0000-000000000001','paykit','missing-label',100,'payload','link')$$,'23514',null,'link needs original label');
select lives_ok($$insert into paykit.transactions(vendor_id,kit_slug,order_ref,amount_cents,qr_payload) values('00180000-0000-0000-0000-000000000001','paykit','legacy',100,'historical')$$,'unknown legacy rows remain readable');
set local role service_role;
select throws_ok($$update paykit.transactions set checkout_kind='image',checkout_label=null where id='00180000-0000-0000-0000-000000000002'$$,'23514','checkout snapshot is immutable','same URL cannot change display kind');
select throws_ok($$update paykit.transactions set checkout_label='Different' where id='00180000-0000-0000-0000-000000000002'$$,'23514','checkout snapshot is immutable','provider label is immutable');
select throws_ok($$update paykit.transactions set qr_payload='https://pay.example/other' where id='00180000-0000-0000-0000-000000000002'$$,'23514','checkout snapshot is immutable','payment destination is immutable');
select throws_ok($$update paykit.transactions set amount_cents=200 where id='00180000-0000-0000-0000-000000000002'$$,'23514','checkout snapshot is immutable','payment amount is immutable');
select lives_ok($$update paykit.transactions set status='claimed',claimed_at=now() where id='00180000-0000-0000-0000-000000000002'$$,'status transitions remain permitted');
reset role;
select ok(not has_function_privilege('anon','paykit.protect_checkout_snapshot()','execute'),'trigger has no public RPC grant');
select throws_ok($$insert into paykit.transactions(vendor_id,kit_slug,order_ref,amount_cents,qr_payload,checkout_label) values('00180000-0000-0000-0000-000000000001','paykit','unknown-with-label',100,'payload','Unproven')$$,'23514',null,'unknown kind cannot carry a label');
select * from finish();
rollback;

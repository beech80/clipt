import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';

test('actual sandbox billing SQL enforces paid entitlements and seven-day Mega grants',async t=>{
 const db=new PGlite();const owner=randomUUID(),other=randomUUID(),post=randomUUID(),second=randomUUID(),game=randomUUID(),request=randomUUID();
 try {
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create schema clipt_private;
   grant usage on schema auth,clipt_private to anon,authenticated,service_role;
   create table auth.users(id uuid primary key);create table profiles(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.user',true),'')::uuid$$;
   create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('test.claims',true),''),'{}')::jsonb$$;
   create function clipt_private.account_available() returns boolean language sql stable as $$select auth.uid() is not null and auth.jwt()->>'aal'='aal2'$$;
   create function clipt_private.blocked_with(uuid) returns boolean language sql stable as $$select false$$;
   create function clipt_private.boost_opportunities(uuid) returns table(boost_id uuid,post_id uuid,package_code text,expires_at timestamptz) language sql as $$select null::uuid,null::uuid,null::text,null::timestamptz where false$$;
   grant execute on function clipt_private.boost_opportunities(uuid) to authenticated;
   create table subscription_plans(id uuid primary key default gen_random_uuid(),clipt_membership_code text,is_active boolean);
   insert into subscription_plans(clipt_membership_code,is_active) values('premium',true),('maxed',true);
   create table user_subscriptions(id uuid primary key,user_id uuid,plan_id uuid,status text,current_period_start timestamptz,current_period_end timestamptz,cancel_at_period_end boolean,updated_at timestamptz,unique(user_id,plan_id));
   create table posts(id uuid primary key,user_id uuid,is_published boolean,is_premium boolean,is_subscriber_only boolean,moderation_hidden boolean,required_tier_id uuid,video_url text,image_url text,post_type text,created_at timestamptz default now(),game_id uuid,content text);
   create table token_wallets(user_id uuid primary key,balance bigint default 0);
   create table content_boosts(post_id uuid,invalidated_at timestamptz,expires_at timestamptz);
   create table follows(follower_id uuid,following_id uuid,created_at timestamptz default now());
   grant select on posts to authenticated;
  `);
  await db.exec(await readFile(new URL('../../database/sandbox_subscription_lifecycle.sql',import.meta.url),'utf8'));
  await db.query('insert into auth.users values($1),($2)',[owner,other]);await db.query('insert into profiles values($1),($2)',[owner,other]);
  await db.query("insert into posts(id,user_id,is_published,is_premium,is_subscriber_only,moderation_hidden,image_url,post_type,game_id) values($1,$2,true,false,false,false,'owned-photo','photo',$3),($4,$2,true,false,false,false,'second-photo','photo',$3)",[post,owner,game,second]);
  const role=async(name='postgres',user=owner,aal='aal2')=>{await db.exec('reset role');await db.query("select set_config('test.user',$1,false),set_config('test.claims',$2,false)",[user,JSON.stringify({aal})]);await db.exec(`set role ${name}`);};
  const cmd=(action,payload)=>db.query('select public.sandbox_billing_command($1,$2) value',[action,JSON.stringify(payload)]);
  const clock=(await db.query("select now()-interval '1 day' as start, now()+interval '29 days' as finish")).rows[0];
  const base={user_id:owner,customer_id:'cus_fixture',subscription_id:'sub_fixture',status:'active',paid_tier:'maxed',paid_start:clock.start.toISOString(),paid_end:clock.finish.toISOString(),cancel_at_period_end:false};
  const sync=(id,created,change={})=>cmd('reconcile',{event_id:id,event_created:created,snapshot:{...base,...change}});
  await t.test('client roles cannot reserve, bind, reconcile or read private billing',async()=>{
   for(const name of ['anon','authenticated']) {await role(name);await assert.rejects(cmd('reserve',{user_id:owner,request_id:request,plan:'maxed'}),/permission denied/);await assert.rejects(db.query('select * from clipt_private.billing_accounts'),/permission denied/);}
  });
  await t.test('durable checkout replays one request and blocks another request or plan',async()=>{
   await role('service_role');let result=await cmd('reserve',{user_id:owner,request_id:request,plan:'maxed'});assert.equal(result.rows[0].value.request_id,request);
   assert.equal((await cmd('reserve',{user_id:owner,request_id:request,plan:'maxed'})).rows[0].value.request_id,request);
   await assert.rejects(cmd('reserve',{user_id:owner,request_id:randomUUID(),plan:'maxed'}),/already pending/);
   await assert.rejects(cmd('reserve',{user_id:owner,request_id:request,plan:'premium'}),/already pending/);
   await cmd('bind',{user_id:owner,request_id:request,customer_id:'cus_fixture',session_id:'cs_test_fixture',session_url:'https://checkout.stripe.com/c/fixture'});
  });
  await t.test('unpaid active status grants no membership and no Mega entitlement',async()=>{
   await sync('evt_unpaid',1,{paid_tier:null,paid_start:null,paid_end:null});
   await role();assert.equal((await db.query('select count(*)::int n from user_subscriptions')).rows[0].n,0);
   await role('authenticated');assert.equal((await db.query('select public.get_weekly_mega_status() value')).rows[0].value.available,false);
  });
  await t.test('paid fulfillment is idempotent and preserves customer/owner binding',async()=>{
   await role('service_role');assert.equal((await sync('evt_paid',2)).rows[0].value,true);assert.equal((await sync('evt_paid',2)).rows[0].value,false);
   await assert.rejects(sync('evt_forged',3,{customer_id:'cus_other'}),/binding/);
   await assert.rejects(sync('evt_duplicate',3,{subscription_id:'sub_duplicate'}),/Duplicate/);
   await assert.rejects(cmd('reserve',{user_id:owner,request_id:randomUUID(),plan:'premium'}),/Existing subscription/);
   await role();assert.equal((await db.query('select count(*)::int n from user_subscriptions')).rows[0].n,1);
  });
  await t.test('legacy unique-plan history prevents payment before provider operations without overwriting records',async()=>{
   await role();const legacyId=randomUUID(),foreignLegacyId=randomUUID();
   await db.query("insert into user_subscriptions(id,user_id,plan_id,status,current_period_start,current_period_end) select $1,$2,id,'canceled',now()-interval '2 months',now()-interval '1 month' from subscription_plans where clipt_membership_code='premium'",[legacyId,owner]);
   await db.query("insert into user_subscriptions(id,user_id,plan_id,status,current_period_start,current_period_end) select $1,$2,id,'canceled',now()-interval '2 months',now()-interval '1 month' from subscription_plans where clipt_membership_code='premium'",[foreignLegacyId,other]);
   await role('service_role');await assert.rejects(cmd('management_reserve',{user_id:owner,request_id:randomUUID(),action:'change_plan',plan:'premium'}),/Legacy target-plan/);
   await assert.rejects(cmd('reserve',{user_id:other,request_id:randomUUID(),plan:'maxed'}),/Legacy subscription/);
   await role();assert.equal((await db.query('select status from user_subscriptions where id=$1',[legacyId])).rows[0].status,'canceled');
   assert.equal((await db.query('select count(*)::int n from clipt_private.billing_management_requests')).rows[0].n,0);
   await db.query('delete from user_subscriptions where id in ($1,$2)',[legacyId,foreignLegacyId]);
  });
  await t.test('management reservations replay exact requests and reject conflicting operations',async()=>{
   await role('service_role');const id=randomUUID();
   const request={user_id:owner,request_id:id,action:'cancel'};
   const first=(await cmd('management_reserve',request)).rows[0].value;
   assert.equal(first.state,'pending');assert.equal(first.subscription_id,'sub_fixture');
   assert.equal((await cmd('management_reserve',request)).rows[0].value.request_id,id);
   await assert.rejects(cmd('management_reserve',{...request,action:'resume'}),/idempotency/);
   await assert.rejects(cmd('management_reserve',{...request,request_id:randomUUID(),action:'change_plan',plan:'premium'}),/original pending/);
   const completed=(await cmd('management_complete',{user_id:owner,request_id:id,result:{testMode:true,fulfillmentStatus:'awaiting_webhook',cancelAtPeriodEnd:true}})).rows[0].value;
   assert.equal(completed.state,'complete');assert.equal((await cmd('management_reserve',request)).rows[0].value.result.cancelAtPeriodEnd,true);
  });
  await t.test('plan-change provider parameters cannot drift on retry and completion does not grant benefits',async()=>{
   const id=randomUUID(), identity={user_id:owner,request_id:id};
   await cmd('management_reserve',{...identity,action:'change_plan',plan:'premium'});
   const original={schedule_id:'sub_sched_fixture',start:1,end:2,current_price:'price_maxed',target_price:'price_premium'};
   assert.deepEqual((await cmd('management_snapshot',{...identity,parameters:original})).rows[0].value.provider_parameters,original);
   assert.deepEqual((await cmd('management_snapshot',{...identity,parameters:{...original,end:3}})).rows[0].value.provider_parameters,original);
   await cmd('management_complete',{...identity,result:{testMode:true,fulfillmentStatus:'awaiting_paid_renewal',plan:'premium'}});
   await role();assert.equal((await db.query('select paid_tier from clipt_private.billing_accounts where user_id=$1',[owner])).rows[0].paid_tier,'maxed');
  });
  const status=async()=> (await db.query('select public.get_weekly_mega_status() value')).rows[0].value;
  const redeem=(target,key,window)=>db.query('select public.redeem_weekly_mega($1,$2,$3) id',[target,key,window]);
  let window,key=randomUUID(),boost;
  await t.test('MFA and foreign user redemption denied; eligible photo redemption free and replay safe',async()=>{
   await role('authenticated',owner,'aal1');await assert.rejects(status(),/Verified/);
   await role('authenticated',other);assert.equal((await status()).available,false);
   await role('authenticated');window=(await status()).window_start;
   boost=(await redeem(post,key,window)).rows[0].id;assert.equal((await redeem(post,key,window)).rows[0].id,boost);
   await assert.rejects(redeem(second,key,window),/Idempotency/);
   await assert.rejects(redeem(second,randomUUID(),window),/unavailable/);
   await role();assert.equal(Number((await db.query('select balance from token_wallets where user_id=$1',[owner])).rows[0].balance),0);
   const row=(await db.query("select extract(epoch from expires_at-activated_at)::int seconds from clipt_private.mega_boosts")).rows[0];assert.equal(row.seconds,86400);
  });
  await t.test('weekly windows do not reset on renewal and active Mega Boosts cannot stack',async()=>{
   await role('service_role');await sync('evt_renewal',3,{paid_end:new Date(clock.finish.getTime()+30*86400000).toISOString()});
   await role('authenticated');assert.equal((await status()).window_start,window);assert.equal((await status()).available,false);
   await role();await db.query("update clipt_private.mega_boosts set window_start=window_start-interval '7 days'");
   await role('authenticated');assert.equal((await status()).available,true);
   await assert.rejects(redeem(post,randomUUID(),window),/already boosted/);
   await redeem(second,randomUUID(),window);assert.equal((await status()).available,false);
   await role();assert.equal((await db.query('select count(*)::int n from clipt_private.mega_boosts')).rows[0].n,2);
   await assert.rejects(db.query("insert into content_boosts(post_id,expires_at) values($1,clock_timestamp()+interval '1 day')",[post]),/already Mega Boosted/);
  });
  await t.test('second paid account cannot redeem another creator’s Clipt or use stale windows',async()=>{
   await role('service_role');const r=randomUUID();
   await cmd('reserve',{user_id:other,request_id:r,plan:'maxed'});
   await cmd('bind',{user_id:other,request_id:r,customer_id:'cus_other',session_id:'cs_test_other',session_url:'https://checkout.stripe.com/c/other'});
   await sync('evt_other',3,{user_id:other,customer_id:'cus_other',subscription_id:'sub_other'});
   await role();const key=(await db.query('select request_id from clipt_private.billing_management_requests where user_id=$1 limit 1',[owner])).rows[0].request_id;
   await role('service_role');await assert.rejects(cmd('management_reserve',{user_id:other,request_id:key,action:'cancel'}),/ownership/);
   await role('authenticated',other);const otherWindow=(await status()).window_start;
   await assert.rejects(redeem(post,randomUUID(),otherWindow),/ineligible/);
   await assert.rejects(redeem(post,randomUUID(),new Date(Date.parse(otherWindow)-7*86400000).toISOString()),/unavailable/);
  });
  await t.test('Mega discovery is labeled, game-scoped and ends permanently on moderation',async()=>{
   await role('authenticated',other);assert.equal((await db.query('select * from public.get_boosted_discovery($1)',[game])).rows[0].package_code,'weekly_mega');
   assert.equal((await db.query('select * from public.get_boosted_discovery($1)',[randomUUID()])).rows.length,0);
   await role();await db.query('update posts set moderation_hidden=true where id=$1',[post]);await db.query('update posts set moderation_hidden=false where id=$1',[post]);
   await role('authenticated',other);assert.equal((await db.query('select * from public.get_boosted_discovery($1)',[game])).rows.some(row=>row.post_id===post),false);
  });
  await t.test('cancellation and failed renewal retain only previously paid period; stale events cannot resurrect',async()=>{
   await role('service_role');await sync('evt_cancel',4,{cancel_at_period_end:true});await sync('evt_failed',5,{status:'past_due',paid_tier:null,paid_start:null,paid_end:null});
   await role();const row=(await db.query('select status,current_period_end,cancel_at_period_end from user_subscriptions where user_id=$1',[owner])).rows[0];assert.equal(row.status,'active');assert.equal(row.cancel_at_period_end,false);assert.equal(row.current_period_end.toISOString(),new Date(clock.finish.getTime()+30*86400000).toISOString());
   await role('service_role');assert.equal((await sync('evt_old',1,{paid_tier:'premium'})).rows[0].value,false);
   await sync('evt_newest',9);await sync('evt_refund',6,{risk_hold:true});await sync('evt_afterrisk',10);
   await role('authenticated');assert.equal((await status()).available,false);
  });
  await t.test('billing-linked erasure fails atomically before removing the profile',async()=>{
   await role();await assert.rejects(db.query('delete from profiles where id=$1',[owner]),/cleanup and retention/);
   assert.equal((await db.query('select count(*)::int n from profiles where id=$1',[owner])).rows[0].n,1);
  });
  await t.test('unpaid upgrade preserves paid Premium; paid downgrade disables Mega without resetting its anchor',async()=>{
   await role('service_role');
   const binding={user_id:other,customer_id:'cus_other',subscription_id:'sub_other'};
   await sync('evt_downgrade',11,{...binding,paid_tier:'premium'});
   await role('authenticated',other);assert.equal((await status()).available,false);
   await role('service_role');await sync('evt_unpaidupgrade',12,{...binding,paid_tier:null,paid_start:null,paid_end:null});
   await role();assert.equal((await db.query('select paid_tier from clipt_private.billing_accounts where user_id=$1',[other])).rows[0].paid_tier,'premium');
   await role('service_role');await sync('evt_paidupgrade',13,binding);
   await role('authenticated',other);assert.equal((await status()).window_start,window);assert.equal((await status()).available,true);
   await role();await db.query("update clipt_private.billing_accounts set paid_end=clock_timestamp()-interval '1 second' where user_id=$1",[other]);
   await role('authenticated',other);assert.equal((await status()).available,false);
   await role('service_role');await assert.rejects(sync('evt_future',14,{...binding,paid_start:new Date(Date.now()+86400000).toISOString()}),/Invalid paid period/);
  });
  await t.test('separate lifecycle identity synchronizes renewal, retry, decline and delayed dispute without touching other accounts',async()=>{
   await role();const isolated=randomUUID(),reservation=randomUUID();
   await db.query('insert into auth.users values($1)',[isolated]);
   await db.query('insert into profiles values($1)',[isolated]);
   const before=(await db.query('select * from clipt_private.billing_accounts where user_id=$1',[owner])).rows[0];
   await role('service_role');
   await cmd('reserve',{user_id:isolated,request_id:reservation,plan:'maxed'});
   await cmd('bind',{user_id:isolated,request_id:reservation,customer_id:'cus_isolated',session_id:'cs_test_isolated',session_url:'https://checkout.stripe.com/c/isolated'});
   const identity={user_id:isolated,customer_id:'cus_isolated',subscription_id:'sub_isolated'};
   const first={...identity,paid_start:new Date(Date.now()-31*86400000).toISOString(),paid_end:new Date(Date.now()-86400000).toISOString()};
   await sync('evt_isolatedFirst',100,first);
   const renewed={...identity,paid_start:new Date(Date.now()-86400000).toISOString(),paid_end:new Date(Date.now()+29*86400000).toISOString()};
   assert.equal((await sync('evt_isolatedRenewal',101,renewed)).rows[0].value,true);
   assert.equal((await sync('evt_isolatedRenewal',101,renewed)).rows[0].value,false);
   await sync('evt_isolatedDecline',102,{...identity,status:'past_due',paid_tier:null,paid_start:null,paid_end:null});
   await role();let account=(await db.query('select * from clipt_private.billing_accounts where user_id=$1',[isolated])).rows[0];
   assert.equal(account.provider_status,'past_due');assert.equal(account.paid_end.toISOString(),renewed.paid_end);
   assert.equal((await db.query('select count(*)::int n from user_subscriptions where user_id=$1',[isolated])).rows[0].n,1);
   await role('service_role');await sync('evt_isolatedDispute',99,{...renewed,risk_hold:true});
   assert.equal((await sync('evt_isolatedDispute',99,{...renewed,risk_hold:true})).rows[0].value,false);
   await sync('evt_isolatedAfterDispute',103,renewed);
   await role();account=(await db.query('select * from clipt_private.billing_accounts where user_id=$1',[isolated])).rows[0];
   assert.equal(account.risk_hold,true);assert.ok(account.paid_end.getTime()<=Date.now());
   assert.equal((await db.query('select status from user_subscriptions where user_id=$1',[isolated])).rows[0].status,'canceled');
   assert.deepEqual((await db.query('select * from clipt_private.billing_accounts where user_id=$1',[owner])).rows[0],before);
  });
 } finally {await db.close();}
});

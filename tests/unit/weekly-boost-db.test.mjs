import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {randomUUID} from 'node:crypto';

test('Premium weekly Boost executes actual migrations in isolated PostgreSQL contract fixture',async t=>{
 const db=new PGlite();
 const file=name=>readFile(new URL(`../../supabase/migrations/${name}.sql`,import.meta.url),'utf8');
 const owner=randomUUID(),other=randomUUID(),post=randomUUID(),second=randomUUID();
 try{
  await db.exec(await readFile(new URL('../fixtures/token-ledger-bootstrap.sql',import.meta.url),'utf8'));
  await db.exec(await file('20260909000300_token_ledger'));
  await db.exec(`create schema clipt_private;grant usage on schema clipt_private to authenticated,service_role;
   create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
   create function clipt_private.account_available() returns boolean language sql stable as $$select auth.uid() is not null and coalesce(auth.jwt()->>'aal','aal1')='aal2'$$;
   create table public.subscription_plans(id uuid primary key default gen_random_uuid(),name text,description text,price numeric,features jsonb,is_active boolean);
   create table public.subscription_tiers(id uuid);
   create table public.user_subscriptions(id uuid primary key default gen_random_uuid(),user_id uuid,plan_id uuid,status text,current_period_start timestamptz,current_period_end timestamptz);
   create table public.posts(id uuid primary key,user_id uuid,is_published boolean,is_premium boolean,is_subscriber_only boolean,moderation_hidden boolean not null default false,required_tier_id uuid,video_url text,post_type text,created_at timestamptz default now(),game_id uuid);
  `);
  await db.exec(await file('20260926172627_approved_boost_catalog'));
  await db.exec(await file('20260926173021_atomic_content_boosts'));
  await db.exec(await file('20260926173944_boost_confirmation_api'));
  // Compile the real erasure function for migration compatibility; this fixture
  // does not claim full hosted erasure/provider verification.
  const erasure=await file('20260927175027_preserve_erasure_moderation_provenance');
  await db.exec(erasure.slice(erasure.indexOf('create or replace function'),erasure.lastIndexOf('commit;')));
  await db.exec(await file('20260929234810_premium_weekly_squad_blast'));
  await db.query('insert into auth.users values ($1),($2)',[owner,other]);
  await db.query("insert into public.posts(id,user_id,is_published,video_url,post_type) values($1,$2,true,'https://example.invalid/test.mp4','clipt'),($3,$2,true,'https://example.invalid/test2.mp4','clipt')",[post,owner,second]);
  await db.query("insert into public.user_subscriptions(user_id,plan_id,status,current_period_start,current_period_end) select $1,id,'active',now()-interval '1 day',now()+interval '1 day' from public.subscription_plans where clipt_membership_code='premium'",[owner]);
  const asRole=async(role,user=owner,aal='aal2')=>{
   await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[user,JSON.stringify({sub:user,aal})]);await db.exec(`set role ${role}`);
  };
  const week=(await db.query("select clipt_private.utc_boost_week(now())::text as value")).rows[0].value;
  const redeem=(id,key=randomUUID(),period=week)=>db.query('select public.redeem_weekly_squad_blast($1,$2,$3) as id',[id,key,period]);
  await t.test('UTC Monday rollover is independent of session timezone',async()=>{
   await db.exec("set timezone='Pacific/Honolulu'");
   const rows=(await db.query("select clipt_private.utc_boost_week('2026-09-27T23:59:59Z')::text a,clipt_private.utc_boost_week('2026-09-28T00:00:00Z')::text b,clipt_private.utc_boost_week('2026-09-27T19:00:00-05:00')::text c")).rows[0];
   assert.deepEqual(rows,{a:'2026-09-21',b:'2026-09-28',c:'2026-09-28'});
  });
  await t.test('anonymous, AAL1 and foreign owner redemption denied',async()=>{
   await asRole('anon');await assert.rejects(redeem(post),/permission denied/i);
   await asRole('authenticated',owner,'aal1');await assert.rejects(redeem(post),/MFA/);
   await asRole('authenticated',other);await assert.rejects(redeem(post),/Premium/);
   await asRole('authenticated');await assert.rejects(redeem(post,randomUUID(),'2000-01-03'),/changed/);
  });
  await t.test('failed eligibility consumes no entitlement and creates no wallet',async()=>{
   await asRole('postgres');await db.query('update public.posts set moderation_hidden=true where id=$1',[post]);
   await asRole('authenticated');await assert.rejects(redeem(post),/eligible/);
   await asRole('postgres');assert.equal((await db.query('select count(*)::int n from public.content_boosts')).rows[0].n,0);
   assert.equal((await db.query('select count(*)::int n from public.token_wallets')).rows[0].n,0);
   await db.query('update public.posts set moderation_hidden=false where id=$1',[post]);
  });
  let key=randomUUID(),boost;
  await t.test('free redemption works at zero balance with no ledger/cash credit',async()=>{
   await asRole('authenticated');boost=(await redeem(post,key)).rows[0].id;
   assert.equal((await redeem(post,key)).rows[0].id,boost);
   const history=(await db.query('select public.get_my_content_boosts() value')).rows[0].value;
   assert.equal(history.length,1);assert.equal(history[0].token_cost,0);assert.equal(history[0].funding_source,'premium_weekly');
   const state=(await db.query('select public.get_boost_economy() value')).rows[0].value;
   assert.equal(state.balance,0);assert.equal(state.weekly_squad_blast.available,false);assert.equal(state.weekly_squad_blast.used,true);
   await asRole('postgres');assert.equal((await db.query('select count(*)::int n from public.token_ledger')).rows[0].n,0);
   assert.equal((await db.query('select extract(epoch from expires_at-activated_at)::int n from public.content_boosts')).rows[0].n,86400);
  });
  await t.test('different key, other content and replay-mode confusion cannot mint another benefit',async()=>{
   await asRole('authenticated');await assert.rejects(redeem(second),/already redeemed/);
   await assert.rejects(redeem(second,key),/conflict/);
   await assert.rejects(db.query("select public.purchase_content_boost($1,'squad_blast',$2,36)",[post,key]),/Price changed/);
   await assert.rejects(db.query('update public.content_boosts set entitlement_week=current_date'),/permission denied/);
   await asRole('authenticated',other);assert.deepEqual((await db.query('select * from public.content_boosts')).rows,[]);
  });
  await t.test('moderation invalidates free distribution but cannot reset consumption',async()=>{
   await asRole('postgres');await db.query('update public.posts set moderation_hidden=true where id=$1',[post]);
   await asRole('authenticated');assert.equal((await redeem(post,key)).rows[0].id,boost);
   assert.equal((await db.query('select public.get_my_content_boosts() value')).rows[0].value[0].state,'invalidated');
   await assert.rejects(redeem(second),/already redeemed/);
  });
  await t.test('historical week does not accumulate and current week allows only one',async()=>{
   await asRole('postgres');await db.query("update public.content_boosts set activated_at=activated_at-interval '7 days',expires_at=expires_at-interval '7 days',entitlement_week=entitlement_week-7 where id=$1",[boost]);
   await asRole('authenticated');assert.equal((await db.query('select public.get_boost_economy() value')).rows[0].value.weekly_squad_blast.available,true);
   await redeem(second);await assert.rejects(redeem(second),/already redeemed/);
  });
 }finally{await db.close();}
});

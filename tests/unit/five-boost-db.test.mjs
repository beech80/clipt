import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';

test('five-Boost social launch preserves atomic wallet and enforces discovery contracts',async t=>{
 const db=new PGlite();const file=name=>readFile(new URL(`../../supabase/migrations/${name}.sql`,import.meta.url),'utf8');
 const owner=randomUUID(),viewer=randomUUID(),limited=randomUUID(),poor=randomUUID(),banned=randomUUID(),racer=randomUUID();
 const game=randomUUID();const photo=randomUUID(),recent=randomUUID(),recruit=randomUUID(),recruitTwo=randomUUID();
 const makePost=(id,user,age='7 hours',media='photo')=>db.query(`insert into public.posts
  (id,user_id,is_published,moderation_hidden,image_url,video_url,post_type,created_at,game_id)
  values($1,$2,true,false,$3,$4,'clipt',now()-$5::interval,$6)`,
  [id,user,media==='photo'?'https://example.invalid/screenshot.jpg':null,media==='video'?'https://example.invalid/clip.mp4':null,age,game]);
 try{
  await db.exec(await readFile(new URL('../fixtures/token-ledger-bootstrap.sql',import.meta.url),'utf8'));
  await db.exec(`alter table auth.users add column deleted_at timestamptz,add column banned_until timestamptz;
   create schema clipt_private;grant usage on schema clipt_private to authenticated,service_role;
   create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
   create function clipt_private.account_available() returns boolean language sql stable as $$select auth.uid() is not null and coalesce(auth.jwt()->>'aal','aal1')='aal2'$$;
   create function clipt_private.blocked_with(uuid) returns boolean language sql stable as $$select false$$;
   create table public.subscription_plans(id uuid primary key default gen_random_uuid(),name text,description text,price numeric,features jsonb,is_active boolean);
   create table public.subscription_tiers(id uuid);
   create table public.user_subscriptions(id uuid primary key default gen_random_uuid(),user_id uuid,plan_id uuid,status text,current_period_start timestamptz,current_period_end timestamptz);
   create table public.posts(id uuid primary key,user_id uuid,is_published boolean,is_premium boolean,is_subscriber_only boolean,
    moderation_hidden boolean not null default false,required_tier_id uuid,video_url text,image_url text,post_type text,
    content text,created_at timestamptz default now(),game_id uuid);
   create table public.follows(follower_id uuid,following_id uuid,created_at timestamptz default now(),primary key(follower_id,following_id));
   create table public.likes(id uuid default gen_random_uuid(),post_id uuid,user_id uuid,created_at timestamptz default now());
   create table public.comments(id uuid default gen_random_uuid(),post_id uuid,user_id uuid,content text,created_at timestamptz default now());
   create table public.external_shares(id uuid default gen_random_uuid(),post_id uuid,user_id uuid,platform text default 'test',created_at timestamptz default now());
   create table public.post_views(id uuid default gen_random_uuid(),post_id uuid,viewer_id uuid,created_at timestamptz default now());
   grant select on public.posts,public.follows,public.likes,public.comments,public.external_shares,public.post_views to authenticated;
  `);
  await db.exec(await file('20260909000300_token_ledger'));
  await db.exec(await file('20260926172627_approved_boost_catalog'));
  await db.exec(await file('20260926173021_atomic_content_boosts'));
  await db.exec(await file('20260926173419_boosted_discovery_opportunities'));
  await db.exec(await file('20260926173944_boost_confirmation_api'));
  const erasure=await file('20260927175027_preserve_erasure_moderation_provenance');
  await db.exec(erasure.slice(erasure.indexOf('create or replace function'),erasure.lastIndexOf('commit;')));
  await db.exec(await file('20260929234810_premium_weekly_squad_blast'));
  await db.exec(await file('20261117121453_five_boost_social_launch'));
  await db.query('insert into auth.users(id) values($1),($2),($3),($4),($5),($6)',[owner,viewer,limited,poor,banned,racer]);
  const asRole=async(role,user=owner)=>{
   await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[user,JSON.stringify({sub:user,aal:'aal2'})]);await db.exec(`set role ${role}`);
  };
  const fund=async(user,amount)=>{await asRole('postgres');await db.query('insert into public.token_wallets(user_id,balance) values($1,$2)',[user,amount]);};
  const buy=(post,code,cost,key=randomUUID())=>db.query('select public.purchase_content_boost($1,$2,$3,$4) id',[post,code,key,cost]);
  await asRole('postgres');await makePost(photo,owner);await makePost(recent,owner,'1 hour');await makePost(recruit,owner);
  await makePost(recruitTwo,owner);await makePost(randomUUID(),viewer);
  await fund(owner,500);

  await t.test('public catalog is exactly five ordered earned-Token packages and Stream Surge is preserved privately',async()=>{
   await asRole('authenticated');const value=(await db.query('select public.get_boost_economy() value')).rows[0].value;
   assert.deepEqual(value.packages.map(p=>[p.code,p.base_price,p.duration_seconds]),[
    ['squad_blast',40,86400],['hidden_gem',50,43200],['chain_reaction',60,21600],
    ['squad_recruit',70,86400],['king_now',80,7200],
   ]);
   assert.equal(value.weekly_content_boost_entitled,false);
   await asRole('postgres');assert.equal((await db.query("select count(*)::int n from public.boost_packages where code='stream_surge'")).rows[0].n,1);
  });
  let hiddenId,recruitId;
  await t.test('Hidden Gem accepts screenshots at six hours, is idempotent, and rejects recent content without charging',async()=>{
   await asRole('authenticated');const key=randomUUID();hiddenId=(await buy(photo,'hidden_gem',50,key)).rows[0].id;
   assert.equal((await buy(photo,'hidden_gem',50,key)).rows[0].id,hiddenId);
   assert.equal((await db.query('select balance from public.token_wallets where user_id=$1',[owner])).rows[0].balance,450);
   assert.equal((await db.query('select extract(epoch from expires_at-activated_at)::int n from public.content_boosts where id=$1',[hiddenId])).rows[0].n,43200);
   await assert.rejects(buy(recent,'hidden_gem',50),/at least 6 hours/);
   assert.equal((await db.query('select balance from public.token_wallets where user_id=$1',[owner])).rows[0].balance,450);
   await assert.rejects(buy(photo,'chain_reaction',60),/already has an active Boost/);
  });
  await t.test('Squad Recruit allows one active creator campaign, lasts 24 hours, and Stream Surge stays unavailable',async()=>{
   await asRole('authenticated');recruitId=(await buy(recruit,'squad_recruit',70)).rows[0].id;
   assert.equal((await db.query('select extract(epoch from expires_at-activated_at)::int n from public.content_boosts where id=$1',[recruitId])).rows[0].n,86400);
   await assert.rejects(buy(recruitTwo,'squad_recruit',70),/active Squad Recruit/);
   await assert.rejects(buy(recruitTwo,'stream_surge',50),/future CLIPT LIVE/);
  });
  await t.test('labeled placement analytics deduplicate viewers and verify actual follows',async()=>{
   await asRole('authenticated',viewer);
   const discovery=(await db.query('select * from public.get_boosted_discovery(null)')).rows;
   assert.ok(discovery.some(row=>row.boost_id===recruitId&&row.creator_id===owner));
   assert.equal((await db.query("select public.record_content_boost_event($1,'impression') value",[recruitId])).rows[0].value,true);
   assert.equal((await db.query("select public.record_content_boost_event($1,'impression') value",[recruitId])).rows[0].value,false);
   assert.equal((await db.query("select public.record_content_boost_event($1,'profile_visit') value",[recruitId])).rows[0].value,true);
   assert.equal((await db.query("select public.record_content_boost_event($1,'follow') value",[recruitId])).rows[0].value,false);
   await asRole('postgres');await db.query('insert into public.follows(follower_id,following_id) values($1,$2)',[viewer,owner]);
   await asRole('authenticated',viewer);assert.equal((await db.query("select public.record_content_boost_event($1,'follow') value",[recruitId])).rows[0].value,true);
   await assert.rejects(db.query('select * from public.content_boost_events'),/permission denied/);
   await asRole('authenticated',owner);const history=(await db.query('select public.get_my_content_boosts() value')).rows[0].value;
   const analytics=history.find(row=>row.id===recruitId).analytics;
   assert.deepEqual([analytics.promotional_impressions,analytics.attributed_profile_visits,analytics.attributed_follows],[1,1,1]);
  });
  await t.test('daily limit permits five atomic activations and rejects the sixth',async()=>{
   await fund(limited,1000);const ids=Array.from({length:6},()=>randomUUID());
   await asRole('postgres');for(const id of ids)await makePost(id,limited);
   await asRole('authenticated',limited);for(const id of ids.slice(0,5))await buy(id,'squad_blast',40);
   await assert.rejects(buy(ids[5],'squad_blast',40),/Daily Boost activation limit/);
   assert.equal((await db.query('select balance from public.token_wallets where user_id=$1',[limited])).rows[0].balance,800);
  });
  await t.test('insufficient balance, banned accounts, deleted content, and simultaneous requests fail closed',async()=>{
   const poorPost=randomUUID(),bannedPost=randomUUID(),deleted=randomUUID(),racePost=randomUUID();
   await asRole('postgres');await makePost(poorPost,poor);await makePost(bannedPost,banned);await makePost(deleted,poor);await makePost(racePost,racer);
   await db.query("update auth.users set banned_until=now()+interval '1 day' where id=$1",[banned]);
   await db.query('delete from public.posts where id=$1',[deleted]);await db.query('insert into public.token_wallets(user_id,balance) values($1,500)',[banned]);
   await db.query('insert into public.token_wallets(user_id,balance) values($1,500)',[racer]);
   await asRole('authenticated',poor);await assert.rejects(buy(poorPost,'squad_blast',40),/Insufficient Tokens/);
   await assert.rejects(buy(deleted,'squad_blast',40),/not eligible/);
   await asRole('authenticated',banned);await assert.rejects(buy(bannedPost,'squad_blast',40),/not eligible to activate/);
   await asRole('authenticated',racer);const results=await Promise.allSettled([
    buy(racePost,'squad_blast',40,randomUUID()),buy(racePost,'chain_reaction',60,randomUUID()),
   ]);
   assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
   assert.equal(results.filter(result=>result.status==='rejected').length,1);
   assert.equal((await db.query('select count(*)::int n from public.content_boosts where user_id=$1',[racer])).rows[0].n,1);
  });
 }finally{await db.close();}
});

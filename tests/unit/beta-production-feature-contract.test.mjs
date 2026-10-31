import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

const release=readFileSync(new URL('../../supabase/release/beta-feature-compatibility.sql',import.meta.url),'utf8');
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
async function baseline({holds=false,partial=false}={}){
 const db=new PGlite();
 await db.exec(`
 create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create schema clipt_private;create schema storage;
 create table auth.users(id uuid primary key);
 create table public.profiles(id uuid primary key references auth.users(id),username text,avatar_url text);
 create table public.games(id uuid primary key default gen_random_uuid(),name text not null,cover_url text,created_at timestamptz not null default now());
 create table public.follows(follower_id uuid references profiles(id) on delete cascade,following_id uuid references profiles(id) on delete cascade);
 create table public.user_blocks(blocker_id uuid,blocked_id uuid);
 create table public.streams(id uuid primary key,user_id uuid references profiles(id),is_live boolean,stream_key text,stream_settings jsonb);
 create table public.posts(id uuid primary key,user_id uuid references profiles(id) on delete cascade,content text,image_url text,
  created_at timestamptz default now(),game_id uuid references games(id),is_published boolean default true,
  moderation_hidden boolean default false,is_premium boolean default false,is_subscriber_only boolean default false,
  required_tier_id uuid,post_type text default 'photo',video_url text);
 create table storage.buckets(id text primary key,public boolean not null);
 insert into storage.buckets values('posts',false);
 create table clipt_private.erasure_tables(table_oid oid primary key,table_name text);
 create table clipt_private.beta_access_config(singleton boolean primary key default true,enabled boolean not null);
 insert into clipt_private.beta_access_config values(true,true);
 create table clipt_private.approved(user_id uuid primary key);
 create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function clipt_private.account_available()returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.profiles where id=auth.uid()) and coalesce(current_setting('test.mfa_denied',true),'false')<>'true'$$;
 create function clipt_private.beta_access_allowed()returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from clipt_private.approved where user_id=auth.uid())$$;
 create function clipt_private.blocked_with(target uuid)returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.user_blocks where (blocker_id=auth.uid() and blocked_id=target) or(blocker_id=target and blocked_id=auth.uid()))$$;
 grant usage on schema auth,clipt_private to anon,authenticated;
 grant all on public.games to authenticated,service_role;
 grant select on public.games,public.posts,public.profiles,public.follows to anon,authenticated;
 grant select(id,user_id,is_live) on public.streams to authenticated;
 alter table public.posts enable row level security;alter table public.games enable row level security;
 create policy legacy_public_read on public.posts for select to anon,authenticated using(true);
 create policy clipt_post_visibility on public.posts as restrictive for select to anon,authenticated
  using((user_id=(select auth.uid()) or(is_published is true and is_premium is not true and is_subscriber_only is not true))
   and not clipt_private.blocked_with(user_id));
 create policy clipt_post_moderation_visibility on public.posts as restrictive for select to anon,authenticated
  using(not moderation_hidden or user_id=(select auth.uid()));
 create policy clipt_beta_access_boundary on public.posts as restrictive for all to anon,authenticated
  using((select clipt_private.beta_access_allowed()))with check((select clipt_private.beta_access_allowed()));
 create policy game_read on public.games for select to anon,authenticated using(true);
 create policy clipt_beta_access_boundary on public.games as restrictive for all to anon,authenticated
  using((select clipt_private.beta_access_allowed()))with check((select clipt_private.beta_access_allowed()));
 `);
 for(let n=1;n<=5;n++){
  await db.query('insert into auth.users values($1)',[id(n)]);
  await db.query('insert into profiles values($1,$2,null)',[id(n),'creator'+n]);
  if(n!==5)await db.query('insert into clipt_private.approved values($1)',[id(n)]);
 }
 await db.query('insert into follows values($1,$2),($3,$2)',[id(2),id(1),id(4)]);
 await db.query('insert into user_blocks values($1,$2)',[id(4),id(1)]);
 await db.query("insert into games(id,name,created_at)values($1,'Fortnite','2025-01-01'),($2,' fortnite ','2025-02-01'),($3,'Other game','2025-01-01')",[id(11),id(12),id(13)]);
 for(let n=100;n<=108;n++)await db.query("insert into posts(id,user_id,content,image_url,game_id)values($1,$2,'Caption #game','owned/photo.jpg',$3)",[id(n),id(1),id(12)]);
 await db.query("update posts set post_type='squad' where id=$1",[id(101)]);
 await db.query("update posts set is_premium=true where id=$1",[id(102)]);
 await db.query("update posts set created_at=now()+interval '1 day' where id=$1",[id(103)]);
 await db.query("update posts set moderation_hidden=true where id=$1",[id(104)]);
 await db.query("update posts set is_published=false where id=$1",[id(105)]);
 await db.query("update posts set video_url='owned/clip.mp4' where id=$1",[id(106)]);
 await db.query("update posts set required_tier_id=$1 where id=$2",[id(40),id(108)]);
 if(holds){
  await db.exec(`create table clipt_private.held(post_id uuid primary key);
   create function clipt_private.photo_review_held(target uuid)returns boolean language sql stable security definer set search_path='' as $$
    select exists(select 1 from clipt_private.held where post_id=target)$$;`);
  await db.query('insert into clipt_private.held values($1)',[id(107)]);
 }
 if(partial)await db.exec('create table clipt_private.azure_review_dispatch(id uuid)');
 return db;
}
async function asUser(db,who,sql,params=[]){
 await db.exec('reset role');
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[who??'']);
 await db.exec('set role authenticated');
 try{return await db.query(sql,params);}finally{await db.exec('reset role');}
}
for(const holds of [false,true])test('production feature rollout preserves content, grants and '+(holds?'installed review holds':'existing manual moderation'),async()=>{
 const db=await baseline({holds});try{
  const before=(await db.query('select id,game_id,content,image_url from posts order by id')).rows;
  await db.exec(release);
  assert.deepEqual((await db.query('select id,game_id,content,image_url from posts order by id')).rows,before);
  assert.equal((await db.query('select count(*)::int count from games')).rows[0].count,3);
  const catalog=(await asUser(db,id(3),'select id,member_ids from game_channel_catalog order by id')).rows;
  assert.equal(catalog.length,2);assert.deepEqual(catalog[0].member_ids,[id(11),id(12)]);
  assert.equal((await asUser(db,id(1),'select clipt_posting_capabilities() ready')).rows[0].ready,true);
  assert.equal((await asUser(db,id(5),'select clipt_posting_capabilities() ready')).rows[0].ready,false);
  // Both the capability and new table policies enforce invitation status.
  assert.equal((await asUser(db,id(2),'select id from posts where id=$1',[id(101)])).rows.length,1);
  for(const who of [3,4,5])assert.equal((await asUser(db,id(who),'select id from posts where id=$1',[id(101)])).rows.length,0);
  const publicRows=(await asUser(db,id(1),'select id from public_channel_posts order by id')).rows.map(x=>x.id);
  assert.deepEqual(publicRows,holds?[id(100)]:[id(100),id(107)]);
  assert.deepEqual((await asUser(db,id(5),'select id from public_channel_posts')).rows,[]);
  const secretGrants=(await db.query("select has_column_privilege('authenticated','streams','game_id','UPDATE') as game_write,has_column_privilege('authenticated','streams','stream_key','SELECT') as key_read,has_column_privilege('authenticated','streams','stream_settings','SELECT') as settings_read")).rows[0];
  assert.deepEqual(secretGrants,{game_write:true,key_read:false,settings_read:false});
  await asUser(db,id(1),'insert into user_mutes(owner_id,muted_id)values($1,$2)',[id(1),id(3)]);
  assert.equal((await asUser(db,id(1),'select * from user_mutes')).rows.length,1);
  assert.deepEqual((await asUser(db,id(2),'select * from user_mutes')).rows,[]);
  await assert.rejects(asUser(db,id(2),'insert into user_mutes(owner_id,muted_id)values($1,$2)',[id(1),id(4)]),/row-level security/);
  await assert.rejects(asUser(db,id(5),'insert into user_mutes(owner_id,muted_id)values($1,$2)',[id(5),id(1)]),/row-level security/);
  await asUser(db,id(1),"insert into scheduled_streams(user_id,title,scheduled_start,is_private)values($1,'Public fixture',now()+interval '1 day',false),($1,'Private fixture',now()+interval '2 days',true)",[id(1)]);
  assert.equal((await asUser(db,id(1),'select * from scheduled_streams')).rows.length,2);
  assert.equal((await asUser(db,id(2),'select * from scheduled_streams')).rows.length,1);
  for(const who of [4,5])assert.equal((await asUser(db,id(who),'select * from scheduled_streams')).rows.length,0);
  await assert.rejects(asUser(db,id(5),"insert into scheduled_streams(user_id,title,scheduled_start)values($1,'Denied fixture',now()+interval '1 day')",[id(5)]),/row-level security/);
  await assert.rejects(asUser(db,id(3),"select cache_verified_public_game('Q1','Forged',null,null)"),/permission denied/);
  await db.exec('set role service_role');
  const imported=(await db.query("select cache_verified_public_game('Q1','Verified game',2020,'PC',null,false) game")).rows[0].game;
  const repeated=(await db.query("select cache_verified_public_game('Q1','Verified game',2020,'PC',null,false) game")).rows[0].game;
  assert.equal(imported.id,repeated.id);
  await db.exec('reset role');
  assert.deepEqual((await db.query('select table_name from clipt_private.erasure_tables order by table_name')).rows.map(x=>x.table_name),['scheduled_streams','user_mutes']);
  await db.query('delete from profiles where id=$1',[id(1)]);
  assert.equal((await db.query('select count(*)::int count from user_mutes')).rows[0].count,0);
  assert.equal((await db.query('select count(*)::int count from scheduled_streams')).rows[0].count,0);
 }finally{await db.close();}
});
test('rollout fails atomically for partial review boundaries or disabled release safeguards',async()=>{
 for(const kind of ['partial','public-media','open-beta']){
  const db=await baseline({partial:kind==='partial'});try{
   if(kind==='public-media')await db.exec('update storage.buckets set public=true');
   if(kind==='open-beta')await db.exec('update clipt_private.beta_access_config set enabled=false');
   await assert.rejects(db.exec(release),/Photo review boundary|Private-media boundary|Invite-only beta/);
   await db.exec('rollback');
   assert.equal((await db.query("select to_regclass('public.user_mutes') as relation")).rows[0].relation,null);
   assert.equal((await db.query("select to_regclass('public.scheduled_streams') as relation")).rows[0].relation,null);
   assert.equal((await db.query("select count(*)::int count from games")).rows[0].count,3);
   assert.equal((await db.query("select count(*)::int count from posts")).rows[0].count,9);
  }finally{await db.close();}
 }
});

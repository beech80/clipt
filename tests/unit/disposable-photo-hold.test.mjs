import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('disposable pre-publication hold is exact, idempotent, private, and never enables scanning',async()=>{
 const db=new PGlite();
 const owner='875b6725-b8fd-4999-a5e5-9527daf01073',post='84de9d7b-e717-4d9c-abed-b75eae5b0073';
 const prepare=await readFile(new URL('../../database/prepare_disposable_photo_hold.sql',import.meta.url),'utf8');
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role;
   create schema clipt_private;create schema auth;create schema storage;
   create table profiles(id uuid primary key);
   create table posts(id uuid primary key,user_id uuid,is_published boolean default false,is_premium boolean default false,
    is_subscriber_only boolean default false,required_tier_id uuid,moderation_hidden boolean default false,
    post_type text default 'clipt',scheduled_publish_time timestamptz,image_url text,video_url text,content text default 'CLIPT moderation test fixture');
   create table storage.objects(bucket_id text,name text);
   create table user_roles(user_id uuid,role text);
   create function auth.uid() returns uuid language sql as $$select null::uuid$$;
   create function clipt_private.account_available() returns boolean language sql as $$select true$$;
   grant usage on schema public,auth to anon,authenticated;
   grant select on posts to anon,authenticated;
   alter table posts enable row level security;
   create policy fixture_public on posts for select using(is_published);`);
  for(const name of ['azure_review_pilot.sql','azure_auto_quarantine.sql','azure_review_dispatch.sql'])
   await db.exec(await readFile(new URL('../../database/'+name,import.meta.url),'utf8'));
  await db.query('insert into profiles values($1)',[owner]);
  await db.query('insert into storage.objects values($1,$2)',['media',owner+'/fixture.png']);
  await db.query('insert into posts(id,user_id,image_url) values($1,$2,$3)',[post,owner,`https://akiksrlzdqvipqbbjxpw.supabase.co/storage/v1/object/authenticated/media/${owner}/fixture.png`]);
  await db.exec(prepare);await db.exec(prepare);
  assert.equal((await db.query('select count(*)::int n from clipt_private.azure_review_dispatch')).rows[0].n,1);
  assert.equal((await db.query('select enabled from clipt_private.azure_dispatch_settings')).rows[0].enabled,false);
  assert.equal((await db.query('select count(*)::int n from clipt_private.azure_review_jobs')).rows[0].n,0);
  assert.equal((await db.query('select is_published from posts')).rows[0].is_published,false);
  await db.exec('set role anon');assert.equal((await db.query('select id from posts')).rows.length,0);
  await db.exec('reset role');
  await db.query('update posts set is_published=true where id=$1',[post]);
  assert.equal((await db.query('select clipt_private.photo_review_held($1) held',[post])).rows[0].held,true);
  await db.exec('set role anon');assert.equal((await db.query('select id from posts')).rows.length,0);
  await db.exec('reset role');
  const claim=await readFile(new URL('../../database/claim_disposable_photo_hold.sql',import.meta.url),'utf8');
  await db.exec(claim);
  assert.equal((await db.query('select enabled from clipt_private.azure_dispatch_settings')).rows[0].enabled,false);
  assert.equal((await db.query('select state from clipt_private.azure_review_dispatch')).rows[0].state,'processing');
  assert.equal((await db.query('select state from clipt_private.azure_review_jobs')).rows[0].state,'pending');
  await assert.rejects(db.exec(claim),/never repeat a reserved claim/);await db.exec('rollback');
  assert.equal((await db.query('select count(*)::int n from clipt_private.azure_review_jobs')).rows[0].n,1);
  // Changed publication metadata is not assumed to match the staged snapshot.
  await assert.rejects(db.exec(prepare),/eligible disposable photo draft/);await db.exec('rollback');
 }finally{await db.close();}
});

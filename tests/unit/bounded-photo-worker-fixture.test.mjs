import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';

test('bounded fixture claims once, holds before visibility, preserves quota and cleans only fixture',async()=>{
 const db=new PGlite(),owner=randomUUID(),post=randomUUID(),path=owner+'/worker-verification-'+post+'.png';
 try{
  await db.exec(`create role anon;create role authenticated;create role authenticator;create role service_role;
   create schema clipt_private;create schema auth;create schema storage;
   create table auth.users(id uuid primary key,email_confirmed_at timestamptz,is_anonymous boolean default false);
   create table profiles(id uuid primary key);
   create table posts(id uuid primary key,user_id uuid,is_published boolean default true,is_premium boolean default false,
    is_subscriber_only boolean default false,required_tier_id uuid,moderation_hidden boolean default false,
    post_type text default 'clipt',scheduled_publish_time timestamptz,image_url text,video_url text,content text);
   create table storage.objects(bucket_id text,name text,owner_id text,owner uuid,metadata jsonb,primary key(bucket_id,name));
   create table user_roles(user_id uuid,role text);
   create function auth.uid() returns uuid language sql as $$select null::uuid$$;
   create function clipt_private.account_available() returns boolean language sql as $$select true$$;
   grant usage on schema public,auth to anon,authenticated;`);
  for(const name of ['database/azure_review_pilot.sql','database/azure_auto_quarantine.sql','database/azure_review_dispatch.sql',
   'supabase/migrations/20261016201209_bounded_photo_worker_fixture.sql'])
   await db.exec(await readFile(new URL('../../'+name,import.meta.url),'utf8'));
  await db.query('insert into auth.users(id,email_confirmed_at) values($1,now())',[owner]);
  await db.query('insert into profiles(id) values($1)',[owner]);
  await db.query("insert into clipt_private.photo_worker_fixture(user_id,post_id,object_path,expires_at) values($1,$2,$3,now()+interval '15 minutes')",[owner,post,path]);
  for(const role of ['anon','authenticated','authenticator']){
   await db.exec('set role '+role);
   await assert.rejects(db.query("select * from public.claim_photo_worker_fixture('prepare')"),/permission denied/);
   await db.exec('reset role');
  }
  assert.equal((await db.query("select * from claim_photo_worker_fixture('prepare')")).rows.length,1);
  assert.equal((await db.query("select * from claim_photo_worker_fixture('prepare')")).rows.length,0);
  await db.query("insert into storage.objects(bucket_id,name,metadata) values('media',$1,'{\"mimetype\":\"image/png\",\"size\":179}')",[path]);
  assert.equal((await db.query("select finish_photo_worker_fixture('prepare',true) ok")).rows[0].ok,true);
  assert.equal((await db.query('select clipt_private.photo_review_held($1) held',[post])).rows[0].held,true);
  assert.equal((await db.query('select enabled from clipt_private.azure_dispatch_settings')).rows[0].enabled,false);
  assert.equal((await db.query('select owner_id from storage.objects')).rows[0].owner_id,owner);
  const job=(await db.query("select * from claim_photo_worker_fixture('run')")).rows[0];
  assert.equal(job.post_id,post);
  assert.equal((await db.query("select * from claim_photo_worker_fixture('run')")).rows.length,0);
  await assert.rejects(db.query("select * from claim_photo_worker_fixture('cleanup')"),/reconciliation/);
  await assert.rejects(db.query("select finish_photo_worker_fixture('run',true)"),/completion proof/);
  await db.query("select finish_azure_review_with_quarantine($1,$2,'no_flag_detected')",[owner,job.request_id]);
  await db.query('select finish_public_photo_dispatch($1,true)',[job.request_id]);
  assert.equal((await db.query("select finish_photo_worker_fixture('run',true) ok")).rows[0].ok,true);
  assert.equal((await db.query("select * from claim_photo_worker_fixture('cleanup')")).rows.length,1);
  await assert.rejects(db.query("select finish_photo_worker_fixture('cleanup',true)"),/Storage cleanup/);
  await db.query('delete from storage.objects where name=$1',[path]);
  assert.equal((await db.query("select finish_photo_worker_fixture('cleanup',true) ok")).rows[0].ok,true);
  assert.equal((await db.query('select count(*)::int n from profiles')).rows[0].n,1);
  assert.equal((await db.query('select count(*)::int n from posts')).rows[0].n,0);
  assert.equal((await db.query('select count(*)::int n from clipt_private.photo_worker_fixture')).rows[0].n,0);
  assert.equal((await db.query('select min(operations)::int n from clipt_private.azure_review_budget')).rows[0].n,2);
 }finally{await db.close();}
});

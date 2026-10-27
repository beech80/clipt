import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';

test('human photo review enforces MFA, snapshot privacy, idempotency and audit isolation',async()=>{
 const db=new PGlite(),owner=randomUUID(),staff=randomUUID();
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role;
   create schema clipt_private;create schema auth;create schema storage;
   create table profiles(id uuid primary key);
   create table posts(id uuid primary key,user_id uuid,is_published boolean default true,
    is_premium boolean default false,is_subscriber_only boolean default false,required_tier_id uuid,
    moderation_hidden boolean default false,post_type text default 'photo',scheduled_publish_time timestamptz,
    image_url text default 'https://dev.invalid/photo.jpg',video_url text,content text default 'Positive caption');
   create table storage.objects(bucket_id text,name text);create table user_roles(user_id uuid,role text);
   create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
   create function auth.jwt() returns jsonb language sql as $$select jsonb_build_object('aal',current_setting('test.aal',true))$$;
   create function clipt_private.account_available() returns boolean language sql as $$select true$$;
   grant usage on schema clipt_private,auth to authenticated;
   grant usage on schema public to anon,authenticated,service_role;`);
  await db.exec(await readFile(new URL('../../database/azure_review_pilot.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../../database/azure_review_disposition.sql',import.meta.url),'utf8'));
  await db.query('insert into profiles values($1),($2)',[owner,staff]);
  await db.query("select set_config('test.uid',$1,false),set_config('test.aal','aal2',false)",[staff]);
  const make=async(state='needs_review')=>{
   await db.exec('reset role');const post=randomUUID(),job=randomUUID();
   await db.query('insert into posts(id,user_id) values($1,$2)',[post,owner]);
   await db.query('select reserve_azure_review($1,$2,$3,1)',[owner,post,job]);
   if(state!=='pending')await db.query('select finish_azure_review($1,$2,$3)',[owner,job,state]);
   await db.exec('set role authenticated');return {post,job};
  };
  const resolve=(job,decision)=>db.query('select resolve_azure_photo_review($1,$2) ok',[job,decision]);
  const first=await make();
  await assert.rejects(resolve(first.job,'dismiss'),/moderator access/);
  await db.exec('reset role');await db.query("insert into user_roles values($1,'moderator')",[staff]);
  await db.query("select set_config('test.aal','aal1',false)");await db.exec('set role authenticated');
  await assert.rejects(resolve(first.job,'dismiss'),/moderator access/);
  await assert.rejects(db.query('select * from azure_photo_review_queue()'),/moderator access/);
  await db.exec('reset role');await db.query("select set_config('test.aal','aal2',false)");await db.exec('set role authenticated');
  await assert.rejects(resolve(first.job,'delete'),/Invalid review decision/);
  await assert.rejects(resolve(first.job,null),/Invalid review decision/);
  await assert.rejects(db.query('select * from clipt_private.azure_review_decisions'),/permission denied/);
  assert.equal((await resolve(first.job,'dismiss')).rows[0].ok,true);
  assert.equal((await resolve(first.job,'dismiss')).rows[0].ok,false);
  await assert.rejects(resolve(first.job,'hide'),/already resolved/);
  assert.equal((await db.query('select * from azure_photo_review_queue()')).rows.length,0);
  const hidden=await make('failed');assert.equal((await resolve(hidden.job,'hide')).rows[0].ok,true);
  await db.exec('reset role');
  assert.equal((await db.query('select moderation_hidden from posts where id=$1',[hidden.post])).rows[0].moderation_hidden,true);
  assert.equal((await db.query('select state from clipt_private.azure_review_jobs where id=$1',[hidden.job])).rows[0].state,'failed');
  const pending=await make('pending');await assert.rejects(resolve(pending.job,'hide'),/Completed flagged/);
  const changed=await make();await db.exec('reset role');await db.query("update posts set content='Edited caption' where id=$1",[changed.post]);await db.exec('set role authenticated');
  await assert.rejects(resolve(changed.job,'dismiss'),/snapshot changed/);
  const privatePhoto=await make();await db.exec('reset role');await db.query('update posts set is_published=false where id=$1',[privatePhoto.post]);await db.exec('set role authenticated');
  await assert.rejects(resolve(privatePhoto.job,'hide'),/snapshot changed/);
  assert.equal((await db.query('select * from azure_photo_review_queue()')).rows.length,1);
  await db.exec('set role anon');await assert.rejects(resolve(first.job,'dismiss'),/permission denied/);
  await db.exec('reset role');
  assert.equal((await db.query('select count(*)::int n from clipt_private.azure_review_decisions')).rows[0].n,2);
  await db.query('delete from profiles where id=$1',[staff]);
  assert.equal((await db.query('select count(*)::int n from clipt_private.azure_review_decisions where actor_id is null')).rows[0].n,2);
 }finally{await db.close();}
});

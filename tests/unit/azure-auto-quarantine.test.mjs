import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';

test('automatic photo quarantine is atomic, service-only, snapshot-bound and idempotent',async()=>{
 const db=new PGlite(),owner=randomUUID(),other=randomUUID(),staff=randomUUID();
 try {
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
   create function clipt_private.account_available() returns boolean language sql as $$select coalesce(current_setting('test.account',true),'true')<>'false'$$;
   grant usage on schema public to anon,authenticated,service_role;`);
  for(const file of ['azure_review_pilot.sql','azure_auto_quarantine.sql','azure_quarantine_appeals.sql'])
   await db.exec(await readFile(new URL('../../database/'+file,import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../../database/fix_quarantine_preview_role_alias.sql',import.meta.url),'utf8'));
  await db.query('insert into profiles values($1),($2),($3)',[owner,other,staff]);
  const make=async()=>{
   await db.exec('reset role');const post=randomUUID(),job=randomUUID();
   await db.query('insert into posts(id,user_id) values($1,$2)',[post,owner]);
   await db.query('select reserve_azure_review($1,$2,$3,1)',[owner,post,job]);
   return {post,job};
  };
  const finish=(job,state='needs_review',actor=owner)=>db.query('select finish_azure_review_with_quarantine($1,$2,$3) ok',[actor,job,state]);
  const first=await make();
  for(const role of ['anon','authenticated']) {
   await db.exec(`set role ${role}`);
   await assert.rejects(finish(first.job),/permission denied/);
   await assert.rejects(db.query('select * from clipt_private.azure_photo_quarantines'),/permission denied/);
  }
  await db.exec('set role service_role');
  await assert.rejects(finish(first.job,'needs_review',other),/ownership mismatch/);
  assert.equal((await finish(first.job)).rows[0].ok,true);
  assert.equal((await finish(first.job)).rows[0].ok,false);
  await db.exec('reset role');
  assert.equal((await db.query('select moderation_hidden from posts where id=$1',[first.post])).rows[0].moderation_hidden,true);
  assert.equal((await db.query('select count(*)::int n from clipt_private.azure_photo_quarantines')).rows[0].n,1);
  await db.query("select set_config('test.uid',$1,false),set_config('test.aal','aal2',false)",[other]);
  await db.exec('set role authenticated');
  assert.equal((await db.query('select * from my_photo_quarantines()')).rows.length,0);
  await assert.rejects(db.query('select appeal_photo_quarantine($1)',[first.job]),/Review unavailable/);
  await assert.rejects(db.query('select * from photo_quarantine_queue()'),/moderator access/);
  await assert.rejects(db.query("select resolve_photo_quarantine($1,'restore')",[first.job]),/moderator access/);
  await assert.rejects(db.query('select * from quarantined_photo_preview($1)',[first.job]),/moderator access/);
  await db.exec('reset role');await db.query("select set_config('test.uid',$1,false)",[owner]);await db.exec('set role authenticated');
  assert.equal((await db.query('select * from my_photo_quarantines()')).rows.length,1);
  assert.equal((await db.query('select appeal_photo_quarantine($1) ok',[first.job])).rows[0].ok,true);
  assert.equal((await db.query('select appeal_photo_quarantine($1) ok',[first.job])).rows[0].ok,false);
  await db.exec('reset role');await db.query("insert into user_roles values($1,'moderator')",[staff]);
  await db.query("select set_config('test.uid',$1,false),set_config('test.aal','aal1',false)",[staff]);await db.exec('set role authenticated');
  await assert.rejects(db.query('select * from photo_quarantine_queue()'),/moderator access/);
  await assert.rejects(db.query('select * from quarantined_photo_preview($1)',[first.job]),/moderator access/);
  await assert.rejects(db.query("select resolve_photo_quarantine($1,'restore')",[first.job]),/moderator access/);
  await db.exec('reset role');await db.query("select set_config('test.aal','aal2',false)");await db.exec('set role authenticated');
  assert.equal((await db.query('select * from photo_quarantine_queue()')).rows.length,1);
  const preview=(await db.query('select * from quarantined_photo_preview($1)',[first.job])).rows;
  assert.equal(preview.length,1);assert.equal(preview[0].post_id,first.post);assert.equal(preview[0].user_id,owner);
  assert.equal((await db.query("select resolve_photo_quarantine($1,'restore') ok",[first.job])).rows[0].ok,true);
  assert.equal((await db.query("select resolve_photo_quarantine($1,'restore') ok",[first.job])).rows[0].ok,false);
  await assert.rejects(db.query("select resolve_photo_quarantine($1,'keep')",[first.job]),/already resolved/);
  await db.exec('reset role');
  assert.equal((await db.query('select moderation_hidden from posts where id=$1',[first.post])).rows[0].moderation_hidden,false);
  for(const state of ['no_flag_detected','failed']) {
   const fixture=await make();await db.exec('set role service_role');await finish(fixture.job,state);await db.exec('reset role');
   assert.equal((await db.query('select moderation_hidden from posts where id=$1',[fixture.post])).rows[0].moderation_hidden,false);
  }
  const stale=await make();
  // Model a worker snapshot mismatch without disabling the deployed guard.
  await db.query("update clipt_private.azure_review_jobs set source_hash='stale' where id=$1",[stale.job]);
  await db.exec('set role service_role');await finish(stale.job);await db.exec('reset role');
  assert.equal((await db.query('select state from clipt_private.azure_review_jobs where id=$1',[stale.job])).rows[0].state,'failed');
  assert.equal((await db.query('select moderation_hidden from posts where id=$1',[stale.post])).rows[0].moderation_hidden,false);
  const atomic=await make();
  await db.exec(`create function clipt_private.reject_test_audit() returns trigger language plpgsql as $$begin raise exception 'audit unavailable';end$$;
   create trigger reject_test_audit before insert on clipt_private.azure_photo_quarantines for each row execute function clipt_private.reject_test_audit();`);
  await db.exec('set role service_role');await assert.rejects(finish(atomic.job),/audit unavailable/);await db.exec('reset role');
  assert.equal((await db.query('select state from clipt_private.azure_review_jobs where id=$1',[atomic.job])).rows[0].state,'pending');
  assert.equal((await db.query('select moderation_hidden from posts where id=$1',[atomic.post])).rows[0].moderation_hidden,false);
  await db.exec('drop trigger reject_test_audit on clipt_private.azure_photo_quarantines');
  const changed=await make();await db.exec('set role service_role');await finish(changed.job);await db.exec('reset role');
  await db.query("update posts set content='Changed after scan' where id=$1",[changed.post]);await db.exec('set role authenticated');
  await assert.rejects(db.query("select resolve_photo_quarantine($1,'restore')",[changed.job]),/snapshot changed/);
  await db.exec('reset role');
  await db.query('delete from posts where id=$1',[first.post]);
  assert.equal((await db.query('select count(*)::int n from clipt_private.azure_photo_quarantines where job_id=$1',[first.job])).rows[0].n,0);
  await db.exec('set role service_role');await assert.rejects(finish(first.job),/ownership mismatch/);
 } finally {await db.close();}
});

test('handler gates automatic quarantine off by default and excludes verification probes',async()=>{
 const source=await readFile(new URL('../../supabase/functions/review-public-photo/index.ts',import.meta.url),'utf8');
 assert.match(source,/CLIPT_AZURE_AUTO_QUARANTINE_ENABLED'\)==='true'/);
 assert.match(source,/CLIPT_AZURE_REVIEW_ENABLED'\)==='true'&&!verificationOnly/);
 assert.match(source,/autoQuarantine\?'finish_azure_review_with_quarantine':'finish_azure_review'/);
});

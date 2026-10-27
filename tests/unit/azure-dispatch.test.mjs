import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {photoWorkerAuthorized} from '../../supabase/functions/_shared/photo-worker-auth.ts';

test('scheduled worker requires a long exact server secret',()=>{
 const key='a1'.repeat(32);
 assert.equal(photoWorkerAuthorized(key,key),true);
 for(const value of [null,undefined,'',key+'x','b'+key.slice(1)])assert.equal(photoWorkerAuthorized(value,key),false);
 assert.equal(photoWorkerAuthorized('short','short'),false);
 assert.equal(photoWorkerAuthorized(key,undefined),false);
});

test('server photo queue holds publication/media, excludes private/video, and preserves versions',async()=>{
 const db=new PGlite(),owner=randomUUID(),other=randomUUID(),post=randomUUID();
 const reference=`https://akiksrlzdqvipqbbjxpw.supabase.co/storage/v1/object/public/media/${owner}/photo.jpg`;
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role;
   create schema clipt_private;create schema auth;create schema storage;
   create table profiles(id uuid primary key,avatar_url text);
   create table posts(id uuid primary key,user_id uuid,is_published boolean default true,is_premium boolean default false,
    is_subscriber_only boolean default false,required_tier_id uuid,moderation_hidden boolean default false,
    post_type text default 'clipt',scheduled_publish_time timestamptz,image_url text,video_url text,content text default 'Great game');
   create table post_video_renditions(post_id uuid,playback_url text);
   create table storage.objects(bucket_id text,name text,owner_id text,owner uuid,primary key(bucket_id,name));
   create table user_roles(user_id uuid,role text);
   create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
   create function clipt_private.account_available() returns boolean language sql as $$select true$$;
   create function clipt_private.blocked_with(uuid) returns boolean language sql as $$select false$$;
   grant usage on schema public,auth,storage to anon,authenticated,service_role;
   grant select on profiles,posts,post_video_renditions,storage.objects to anon,authenticated;
   alter table posts enable row level security;create policy fixture_public on posts for select using(true);
   create policy fixture_moderation on posts as restrictive for select using(not moderation_hidden or user_id=auth.uid());
   alter table storage.objects enable row level security;create policy fixture_storage on storage.objects for select using(true);`);
  for(const file of ['azure_review_pilot.sql','azure_auto_quarantine.sql','azure_review_dispatch.sql'])
   await db.exec(await readFile(new URL('../../database/'+file,import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../../supabase/migrations/20261003214916_secure_private_media_read_eligibility.sql',import.meta.url),'utf8'));
  await db.query('insert into profiles(id) values($1),($2)',[owner,other]);
  await db.query('insert into storage.objects values($1,$2,$3,$4)',['media',owner+'/photo.jpg',owner,owner]);
  // Disabled by default: no retroactive queue or external work.
  const old=randomUUID();await db.query('insert into posts(id,user_id,image_url) values($1,$2,$3)',[old,owner,reference]);
  assert.equal((await db.query('select count(*)::int n from clipt_private.azure_review_dispatch')).rows[0].n,0);
  await db.exec('update clipt_private.azure_dispatch_settings set enabled=true');
  await assert.rejects(db.query('insert into posts(id,user_id,image_url,content) values($1,$2,$3,$4)',[randomUUID(),owner,reference,'a'.repeat(501)]),/500 characters/);
  await assert.rejects(db.query('insert into posts(id,user_id,image_url,content) values($1,$2,$3,$4)',[randomUUID(),owner,reference,'🎮'.repeat(251)]),/500 characters/);
  await db.query('insert into posts(id,user_id,image_url) values($1,$2,$3)',[post,owner,reference]);
  await db.query('insert into posts(id,user_id,image_url,is_published) values($1,$2,$3,false)',[randomUUID(),owner,reference]);
  await db.query('insert into posts(id,user_id,image_url,video_url) values($1,$2,$3,$4)',[randomUUID(),owner,reference,reference+'.mp4']);
  assert.equal((await db.query('select count(*)::int n from clipt_private.azure_review_dispatch')).rows[0].n,1);
  // Remove unrelated fixture references so media eligibility tests this post only.
  await db.query('delete from posts where id<>$1',[post]);
  // Execute the exact eligibility patch against isolated minimal contracts;
  // this is not a subscription lifecycle or financial-record test.
  await db.exec(`CREATE FUNCTION clipt_private.mega_opportunities(p_game uuid) RETURNS TABLE(post_id uuid)
   LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$SELECT p.id FROM public.posts p WHERE p.is_published AND NOT p.moderation_hidden$$;
   CREATE FUNCTION clipt_private.redeem_mega(p_post uuid,p_request uuid,p_window timestamptz) RETURNS boolean
   LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$DECLARE target public.posts%rowtype; BEGIN
    SELECT * INTO target FROM public.posts WHERE id=p_post;
    IF target.id IS NULL OR target.moderation_hidden THEN RETURN false; END IF; RETURN true; END$$;`);
  await db.exec(await readFile(new URL('../../database/azure_review_mega_guards.sql',import.meta.url),'utf8'));
  assert.equal((await db.query('select * from clipt_private.mega_opportunities(null)')).rows.length,0);
  assert.equal((await db.query('select clipt_private.redeem_mega($1,$2,now()) ok',[post,randomUUID()])).rows[0].ok,false);
  await db.exec('set role anon');
  assert.equal((await db.query('select id from posts')).rows.length,0);
  assert.equal((await db.query('select name from storage.objects')).rows.length,0);
  await assert.rejects(db.query('select * from claim_public_photo_review()'),/permission denied/);
  await db.exec('reset role');await db.query("select set_config('test.uid',$1,false)",[owner]);await db.exec('set role authenticated');
  assert.equal((await db.query('select id from posts')).rows.length,1);
  assert.equal((await db.query('select name from storage.objects')).rows.length,1);
  assert.equal((await db.query('select * from my_photo_review_holds()')).rows.length,1);
  await assert.rejects(db.query('select * from clipt_private.azure_review_dispatch'),/permission denied/);
  await assert.rejects(db.query('select * from claim_public_photo_review()'),/permission denied/);
  await db.exec('set role service_role');
  const job=(await db.query('select * from claim_public_photo_review()')).rows[0];assert.equal(job.post_id,post);
  assert.equal((await db.query('select * from claim_public_photo_review()')).rows.length,0);
  await assert.rejects(db.query('select finish_public_photo_dispatch($1,true)',[job.request_id]),/Completed review proof/);
  await db.query('select reserve_azure_review($1,$2,$3,2)',[owner,post,job.request_id]);
  await db.query("select finish_azure_review_with_quarantine($1,$2,'no_flag_detected')",[owner,job.request_id]);
  await db.query('select finish_public_photo_dispatch($1,true)',[job.request_id]);
  await db.exec('reset role');await db.query("select set_config('test.uid','',false)");await db.exec('set role anon');
  assert.equal((await db.query('select id from posts')).rows.length,1);
  assert.equal((await db.query('select name from storage.objects')).rows.length,1);
  await db.exec('reset role');
  assert.equal((await db.query('select * from clipt_private.mega_opportunities(null)')).rows.length,1);
  assert.equal((await db.query('select clipt_private.redeem_mega($1,$2,now()) ok',[post,randomUUID()])).rows[0].ok,true);
  await assert.rejects(db.query('update storage.objects set name=name where name=$1',[owner+'/photo.jpg']),/immutable/);
  await db.query('delete from storage.objects where name=$1',[owner+'/photo.jpg']);
  await assert.rejects(db.query('insert into storage.objects values($1,$2,$3,$4)',['media',owner+'/photo.jpg',owner,owner]),/immutable/);
  await db.query("update posts set content='Another positive caption' where id=$1",[post]);
  await db.exec('set role anon');assert.equal((await db.query('select id from posts')).rows.length,0);
  await db.exec('set role service_role');const changed=(await db.query('select * from claim_public_photo_review()')).rows[0];
  assert.equal(changed.reserved,true);
  assert.equal((await db.query('select reserve_azure_review($1,$2,$3,2) ok',[owner,post,changed.request_id])).rows[0].ok,false);
  await db.query("select finish_azure_review_with_quarantine($1,$2,'failed')",[owner,changed.request_id]);
  await db.query('select finish_public_photo_dispatch($1,false)',[changed.request_id]);
  await db.exec('set role anon');assert.equal((await db.query('select id from posts')).rows.length,0);
  await db.exec('reset role');await db.query('delete from posts where id=$1',[post]);
  assert.equal((await db.query('select count(*)::int n from clipt_private.azure_review_dispatch')).rows[0].n,0);
  await db.exec('update clipt_private.azure_dispatch_settings set enabled=false');
  const legacy=randomUUID();await db.query('insert into posts(id,user_id,image_url) values($1,$2,$3)',[legacy,owner,reference]);
  assert.equal((await db.query('select enqueue_existing_photo_reviews(10) n')).rows[0].n,0);
  await assert.rejects(db.query('select enqueue_existing_photo_reviews(11)'),/Batch limit/);
  await db.exec('set role authenticated');await assert.rejects(db.query('select enqueue_existing_photo_reviews(1)'),/permission denied/);
  await db.exec('reset role');await db.exec('update clipt_private.azure_dispatch_settings set enabled=true');
  assert.equal((await db.query('select enqueue_existing_photo_reviews(10) n')).rows[0].n,1);
  assert.equal((await db.query('select enqueue_existing_photo_reviews(10) n')).rows[0].n,0);
  await db.query('delete from posts where id=$1',[legacy]);
  const scheduled=randomUUID();
  await db.query("insert into posts(id,user_id,image_url,scheduled_publish_time) values($1,$2,$3,now()+interval '1 day')",[scheduled,owner,reference]);
  assert.equal((await db.query('select count(*)::int n from clipt_private.azure_review_dispatch where post_id=$1',[scheduled])).rows[0].n,1);
  assert.equal((await db.query('select * from claim_public_photo_review()')).rows.length,0);
  assert.equal((await db.query('select clipt_private.photo_review_held($1) held',[scheduled])).rows[0].held,true);
 }finally{await db.close();}
});

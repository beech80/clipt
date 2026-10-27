import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('Squad SQL protects direct post and private media access across independent users', async t => {
  const db = new PGlite();
  const owner='00000000-0000-4000-8000-000000000001', follower='00000000-0000-4000-8000-000000000002', stranger='00000000-0000-4000-8000-000000000003';
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth; create schema clipt_private; create schema storage;
      grant usage on schema auth,clipt_private,storage to anon,authenticated;
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
      create function clipt_private.account_available() returns boolean language sql stable as $$select auth.uid() is not null and (current_setting('test.enrolled',true)!='true' or current_setting('test.aal',true)='aal2')$$;
      create function clipt_private.blocked_with(actor uuid) returns boolean language sql stable as $$select coalesce(actor::text=nullif(current_setting('test.blocked',true),''),false)$$;
      create table posts(id int primary key,user_id uuid,post_type text,is_published boolean,is_premium boolean default false,is_subscriber_only boolean default false,moderation_hidden boolean default false,required_tier_id uuid,scheduled_publish_time timestamptz,video_url text,image_url text);
      create table follows(follower_id uuid,following_id uuid); create table profiles(id uuid,avatar_url text); create table post_video_renditions(post_id int,playback_url text); create table storage.objects(bucket_id text,name text,owner_id text,owner uuid);
      alter table posts enable row level security; alter table follows enable row level security; alter table storage.objects enable row level security;
      grant select on posts,follows,profiles,post_video_renditions,storage.objects to anon,authenticated;
      grant insert,update on posts to authenticated;
      create policy old_read on posts for select using(true);
      create policy old_insert on posts for insert to authenticated with check(user_id=auth.uid());
      create policy old_update on posts for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
      create policy old_visibility on posts as restrictive for select using((user_id=auth.uid() or (is_published and not is_premium and not is_subscriber_only)) and not clipt_private.blocked_with(user_id));
      create policy old_moderation on posts as restrictive for select using(not moderation_hidden or user_id=auth.uid());
      create policy old_mfa on posts as restrictive for all to authenticated using(clipt_private.account_available()) with check(clipt_private.account_available());
      create policy own_follows on follows for select using(follower_id=auth.uid() or following_id=auth.uid());
      create policy old_storage on storage.objects for select using(true);
      create policy storage_mfa on storage.objects as restrictive for all to authenticated using(clipt_private.account_available());
    `);
    await db.exec(await readFile(new URL('../../database/secure_squad_post_visibility.sql',import.meta.url),'utf8'));
    await db.exec(await readFile(new URL('../../supabase/migrations/20261003214916_secure_private_media_read_eligibility.sql',import.meta.url),'utf8'));
    await db.query('insert into follows values($1,$2)',[follower,owner]);
    for(const [id,type,published] of [[1,'clipt',true],[2,'squad',true],[3,'clipt',false],[4,'squad',false]]) {
      const url=`https://akiksrlzdqvipqbbjxpw.supabase.co/storage/v1/object/public/media/${owner}/${id}.mp4`;
      await db.query('insert into posts(id,user_id,post_type,is_published,video_url) values($1,$2,$3,$4,$5)',[id,owner,type,published,url]);
      await db.query('insert into storage.objects values($1,$2,$3,$4)',['media',`${owner}/${id}.mp4`,owner,owner]);
    }
    const as=async(uid='',enrolled=false,aal='aal1',blocked='')=>{
      await db.exec('reset role'); await db.query("select set_config('test.uid',$1,false),set_config('test.enrolled',$2,false),set_config('test.aal',$3,false),set_config('test.blocked',$4,false)",[uid,String(enrolled),aal,blocked]); await db.exec(`set role ${uid?'authenticated':'anon'}`);
    };
    const posts=async()=> (await db.query('select id from posts order by id')).rows.map(r=>r.id);
    const media=async()=> (await db.query('select name from storage.objects order by name')).rows.map(r=>Number(r.name.split('/').at(-1).split('.')[0]));
    await t.test('guest and stranger cannot read Squad or drafts even through direct object queries',async()=>{
      for(const actor of ['',stranger]) {await as(actor);assert.deepEqual(await posts(),[1]);assert.deepEqual(await media(),[1]);}
    });
    await t.test('follower sees published Squad but never either kind of private draft',async()=>{
      await as(follower);assert.deepEqual(await posts(),[1,2]);assert.deepEqual(await media(),[1,2]);
    });
    await t.test('owner sees drafts; capability is true only with valid account assurance',async()=>{
      await as(owner);assert.deepEqual(await posts(),[1,2,3,4]);assert.equal((await db.query('select clipt_posting_capabilities() ready')).rows[0].ready,true);
      await as(owner,true);assert.deepEqual(await posts(),[]);assert.deepEqual(await media(),[]);assert.equal((await db.query('select clipt_posting_capabilities() ready')).rows[0].ready,false);
      await as(owner,true,'aal2');assert.deepEqual(await posts(),[1,2,3,4]);
    });
    await t.test('unfollow and block revoke subsequent post and media eligibility',async()=>{
      await as(follower,false,'aal1',owner);assert.deepEqual(await posts(),[]);assert.deepEqual(await media(),[]);
      await db.exec('reset role');await db.query('delete from follows where follower_id=$1',[follower]);
      await as(follower);assert.deepEqual(await posts(),[1]);assert.deepEqual(await media(),[1]);
    });
    await t.test('non-owner cannot change or publish another users draft',async()=>{
      await as(stranger);assert.equal((await db.query('update posts set is_published=true where id=3 returning id')).rows.length,0);
      await assert.rejects(db.query('insert into posts(id,user_id,post_type,is_published) values(8,$1,$2,true)',[owner,'squad']),/row-level security/);
      await as(owner);assert.equal((await db.query('update posts set is_published=true where id=3 returning id')).rows.length,1);
    });
  } finally {await db.close();}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('photo Trophy eligibility extends real policy/ranking without removing RLS or MFA',async t=>{
  const db=new PGlite();
  const owner='00000000-0000-4000-8000-000000000001',voter='00000000-0000-4000-8000-000000000002';
  const photo='00000000-0000-4000-8000-000000000010',video='00000000-0000-4000-8000-000000000011';
  try {
    await db.exec(`create role anon;create role authenticated;create role service_role;
      create schema auth;grant usage on schema public,auth to anon,authenticated;
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
      create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('is_anonymous',false)$$;
      create table profiles(id uuid primary key,username text,avatar_url text);
      create table posts(id uuid primary key,user_id uuid,content text,video_url text,image_url text,is_published boolean default true,is_premium boolean default false,is_subscriber_only boolean default false,post_type text default 'clipt',created_at timestamptz default now(),moderation_hidden boolean default false,required_tier_id uuid,scheduled_publish_time timestamptz);
      create table clip_votes(id uuid default gen_random_uuid(),post_id uuid,user_id uuid,created_at timestamptz default now(),unique(post_id,user_id));
      grant select on posts,profiles,clip_votes to anon,authenticated;
      alter table posts enable row level security;alter table clip_votes enable row level security;
      create policy existing_posts on posts for select using(is_published and not moderation_hidden and not is_premium and not is_subscriber_only and required_tier_id is null and (scheduled_publish_time is null or scheduled_publish_time<=now()));
      create policy existing_votes on clip_votes for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
      create policy mfa_votes on clip_votes as restrictive for all to authenticated using(current_setting('test.aal',true)='aal2') with check(current_setting('test.aal',true)='aal2');
    `);
    await db.exec(await readFile(new URL('../../supabase/migrations/20260920115520_secure_trophy_rankings.sql',import.meta.url),'utf8'));
    await db.exec(await readFile(new URL('../../supabase/migrations/20260920120613_support_legacy_clipt_rankings.sql',import.meta.url),'utf8'));
    await db.exec(await readFile(new URL('../../database/secure_photo_trophy_eligibility.sql',import.meta.url),'utf8'));
    await db.query('insert into profiles values($1,$2,null)',[owner,'photo-owner']);
    await db.query('insert into posts(id,user_id,content,image_url) values($1,$2,$3,$4)',[photo,owner,'photo','owner/photo.jpg']);
    await db.query('insert into posts(id,user_id,content,video_url) values($1,$2,$3,$4)',[video,owner,'video','owner/clip.mp4']);
    await db.query("select set_config('test.uid',$1,false),set_config('test.aal','aal2',false)",[voter]);await db.exec('set role authenticated');
    await t.test('photos and videos accept free votes and rank together; duplicate votes remain rejected',async()=>{
      for(const id of [photo,video]) await db.query('insert into clip_votes(post_id,user_id) values($1,$2)',[id,voter]);
      await assert.rejects(db.query('insert into clip_votes(post_id,user_id) values($1,$2)',[photo,voter]));
      const ranked=await db.query("select * from get_top_clipts('all-time')");assert.equal(ranked.rows.length,2);assert.ok(ranked.rows.some(row=>row.post_id===photo));
    });
    await t.test('MFA password-only vote access remains denied',async()=>{
      await db.query("select set_config('test.aal','aal1',false)");assert.equal((await db.query('select * from clip_votes')).rows.length,0);
      await assert.rejects(db.query('insert into clip_votes(post_id,user_id) values($1,$2)',[photo,voter]));await db.query("select set_config('test.aal','aal2',false)");
    });
    await t.test('moderation, private/Squad content and invalid periods remain excluded',async()=>{
      await db.exec('reset role');await db.exec('delete from clip_votes');await db.query('update posts set moderation_hidden=true where id=$1',[photo]);await db.query("update posts set post_type='squad' where id=$1",[video]);await db.exec('set role authenticated');
      assert.equal((await db.query("select * from get_top_clipts('all-time')")).rows.length,0);
      for(const id of [photo,video]) await assert.rejects(db.query('insert into clip_votes(post_id,user_id) values($1,$2)',[id,voter]),/row-level security/);
      for(const state of ['is_published=false','is_premium=true','is_subscriber_only=true','required_tier_id=user_id',"scheduled_publish_time=now()+interval '1 day'"]) {
        await db.exec('reset role');
        await db.query('update posts set moderation_hidden=false,is_published=true,is_premium=false,is_subscriber_only=false,required_tier_id=null,scheduled_publish_time=null where id=$1',[photo]);
        await db.query(`update posts set ${state} where id=$1`,[photo]);
        await db.exec('set role authenticated');
        await assert.rejects(db.query('insert into clip_votes(post_id,user_id) values($1,$2)',[photo,voter]),/row-level security/);
      }
      await assert.rejects(db.query("select * from get_top_clipts('fake-period')"));
    });
  } finally {await db.close();}
});

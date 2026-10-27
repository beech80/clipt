import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('actual social notification trigger supports image-only posts and suppresses self/blocked events', async()=>{
  const db=new PGlite();
  const owner='00000000-0000-4000-8000-000000000001', actor='00000000-0000-4000-8000-000000000002';
  const post='00000000-0000-4000-8000-000000000010', parent='00000000-0000-4000-8000-000000000020';
  try {
    // Minimal isolated trigger fixture; not a replacement for the full deployed RLS suite.
    await db.exec(`create role anon; create role authenticated; create role service_role;
      create schema auth; create schema clipt_private;
      create function auth.uid() returns uuid language sql as $$select null::uuid$$;
      create function clipt_private.blocked_with(uuid) returns boolean language sql as $$select false$$;
      create type notification_type as enum('follow','like','comment','reply');
      create table posts(id uuid primary key,user_id uuid,image_url text,video_url text);
      create table follows(follower_id uuid,following_id uuid);
      create table likes(user_id uuid,post_id uuid);
      create table comments(id uuid default gen_random_uuid(),user_id uuid,post_id uuid,parent_id uuid);
      create table user_blocks(blocker_id uuid,blocked_id uuid);
      create table notifications(user_id uuid,actor_id uuid,type notification_type,resource_id uuid,resource_type text);`);
    await db.exec(await readFile(new URL('../../supabase/migrations/20260916133930_derive_social_notifications_from_events.sql',import.meta.url),'utf8'));
    await db.query('insert into posts values($1,$2,$3,null)',[post,owner,'private/photo.jpg']);
    await db.query('insert into likes values($1,$2)',[actor,post]);
    await db.query('insert into comments(id,user_id,post_id) values($1,$2,$3)',[parent,owner,post]);
    await db.query('insert into comments(user_id,post_id,parent_id) values($1,$2,$3)',[actor,post,parent]);
    await db.query('insert into comments(user_id,post_id) values($1,$2)',[actor,post]);
    await db.query('insert into follows values($1,$2)',[actor,owner]);
    const events=(await db.query('select * from notifications order by type')).rows;
    assert.equal(events.length,4);
    assert.deepEqual(new Set(events.map(row=>row.type)),new Set(['like','reply','comment','follow']));
    assert.ok(events.every(row=>row.user_id===owner && row.actor_id===actor));
    assert.ok(events.filter(row=>row.type!=='follow').every(row=>row.resource_id===post && row.resource_type==='post'));
    await db.query('insert into likes values($1,$2)',[owner,post]);
    await db.query('insert into user_blocks values($1,$2)',[owner,actor]);
    await db.query('insert into likes values($1,$2)',[actor,post]);
    await db.query('insert into comments(user_id,post_id) values($1,$2)',[actor,post]);
    assert.equal((await db.query('select count(*)::int as count from notifications')).rows[0].count,4);
    assert.equal((await db.query("select has_function_privilege('authenticated','clipt_private.notify_social_event()','EXECUTE') as allowed")).rows[0].allowed,false);
  } finally {await db.close();}
});

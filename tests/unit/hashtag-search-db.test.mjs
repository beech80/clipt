import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('hashtag index, visibility and deduplicated search counts use real SQL',async()=>{
 const db=new PGlite();
 try {
  await db.exec(`create role anon; create role authenticated; create schema auth; create schema clipt_private;
   create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.actor',true),'')::uuid$$;
   create function clipt_private.account_available() returns boolean language sql as $$select true$$;
   create function clipt_private.beta_access_allowed() returns boolean language sql as $$select true$$;
   create table posts(id uuid primary key default gen_random_uuid(),content text,is_published boolean default false);
   create table hashtags(id uuid primary key default gen_random_uuid(),name text unique);
   create table post_hashtags(post_id uuid references posts(id),hashtag_id uuid references hashtags(id),primary key(post_id,hashtag_id));
   create view public_clipt_discovery with(security_invoker=true) as select id from posts where is_published;
   create view public_channel_posts with(security_invoker=true) as select id from posts where false;
   grant usage on schema public,auth,clipt_private to authenticated;
   grant select on posts,hashtags,post_hashtags,public_clipt_discovery,public_channel_posts to authenticated;
   insert into auth.users values('00000000-0000-4000-8000-000000000001');`);
  for(const name of ['20261117173000_hashtag_search_counts','20261117174500_index_post_hashtags'])
   await db.exec(await readFile(new URL('../../supabase/migrations/'+name+'.sql',import.meta.url),'utf8'));
  await db.exec("insert into posts(content,is_published) values('Hi #Gaming #gaming',true),('#private',false)");
  assert.equal((await db.query('select * from post_hashtags')).rows.length,2);
  await db.exec("set role authenticated; set test.actor='00000000-0000-4000-8000-000000000001'");
  assert.deepEqual((await db.query("select tag from search_hashtags('')")).rows,[{tag:'gaming'}]);
  assert.equal((await db.query("select record_hashtag_search('Gaming') as n")).rows[0].n,1);
  assert.equal((await db.query("select record_hashtag_search('#gaming') as n")).rows[0].n,1);
  assert.equal((await db.query("select search_count from search_hashtags('gam')")).rows[0].search_count,1);
  await assert.rejects(db.query("update hashtag_search_counts set search_count=1000"));
  await assert.rejects(db.query("select record_hashtag_search('bad tag')"));
  await db.exec("reset role; update posts set content='#newtag' where is_published; set role authenticated");
  assert.deepEqual((await db.query("select tag from search_hashtags('')")).rows,[{tag:'newtag'}]);
  await db.exec("set test.actor=''");
  await assert.rejects(db.query("select record_hashtag_search('newtag')"));
 }finally{await db.close();}
});

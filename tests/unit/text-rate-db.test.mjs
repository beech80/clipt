import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
test('fixed database text limits prevent direct-write bypass, spoofing and ledger resets',async()=>{
 const db=new PGlite();const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
 try {
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create schema clipt_private;
   grant usage on schema auth,clipt_private to authenticated;
   create function auth.uid() returns uuid language sql stable as $$select current_setting('test.uid')::uuid$$;
   create function clipt_private.account_available() returns boolean language sql stable as $$select current_setting('test.aal')='aal2'$$;
   create table messages(sender_id uuid,content text);create table group_messages(sender_id uuid,content text);
   create table comments(user_id uuid,content text);create table posts(user_id uuid,content text);create table stream_chat(user_id uuid,message text);
   create table content_filters(word text,action_type text);
   grant insert,select on messages,group_messages,comments,posts,stream_chat to authenticated;`);
  await db.exec(await readFile(new URL('../../database/strict_text_content_guard.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../../database/enforce_text_write_rate_limits.sql',import.meta.url),'utf8'));
  await db.query("select set_config('test.uid',$1,false),set_config('test.aal','aal2',false)",[a]);await db.exec('set role authenticated');
  await assert.rejects(db.query('insert into messages values($1,$2)',[a,'sh1t']),/community rules/);
  for(let i=0;i<20;i++)await db.query('insert into messages values($1,$2)',[a,'Hello']);
  for(const table of ['messages','group_messages','comments','stream_chat'])await assert.rejects(db.query(`insert into ${table} values($1,$2)`,[a,'overflow']),/Too many/);
  assert.equal((await db.query('select count(*)::int as n from messages')).rows[0].n,20);
  await assert.rejects(db.query('delete from clipt_private.text_write_buckets'),/permission denied/);
  for(let i=0;i<5;i++)await db.query('insert into posts values($1,$2)',[a,'Post']);
  await assert.rejects(db.query('insert into posts values($1,$2)',[a,'overflow']),/Too many/);
  await assert.rejects(db.query('insert into messages values($1,$2)',[b,'spoof']),/Verified account/);
  await db.query("select set_config('test.uid',$1,false)",[b]);await db.query('insert into messages values($1,$2)',[b,'Independent']);
  await db.query("select set_config('test.aal','aal1',false)");await assert.rejects(db.query('insert into posts values($1,$2)',[b,'MFA bypass']),/Verified account/);
  await db.exec("reset role;update clipt_private.text_write_buckets set window_start=clock_timestamp()-interval '61 seconds';set role authenticated");
  await db.query("select set_config('test.uid',$1,false),set_config('test.aal','aal2',false)",[a]);await db.query('insert into messages values($1,$2)',[a,'After rollover']);
 } finally {await db.close();}
});

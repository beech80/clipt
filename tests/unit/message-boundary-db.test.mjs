import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('actual message grants/policies isolate participants and restrict receipts/identity edits',async()=>{
  const db=new PGlite();
  const alice='00000000-0000-4000-8000-000000000001',bob='00000000-0000-4000-8000-000000000002',eve='00000000-0000-4000-8000-000000000003';
  try {
    await db.exec(`create role anon;create role authenticated;create role service_role;
      create schema auth;create schema clipt_private;grant usage on schema auth,clipt_private to authenticated;
      create function auth.uid() returns uuid language sql stable as $$select current_setting('test.uid')::uuid$$;
      create function clipt_private.blocked_with(uuid) returns boolean language sql stable as $$select current_setting('test.blocked',true)='true'$$;
      create table messages(id uuid default gen_random_uuid(),sender_id uuid,receiver_id uuid,content text,message_type text,metadata jsonb,reply_to uuid,read boolean default false);
      alter table messages enable row level security;
      create policy existing on messages for all to authenticated using(true) with check(true);`);
    const sql=await readFile(new URL('../../supabase/migrations/20260916132419_protect_wallet_messaging_and_stream_secrets.sql',import.meta.url),'utf8');
    const section=sql.slice(sql.indexOf('REVOKE ALL ON public.messages'),sql.indexOf('-- Notification identity'));
    assert.ok(section.includes('message_delete_boundary'));await db.exec(section);
    await db.query("select set_config('test.uid',$1,false),set_config('test.blocked','false',false)",[alice]);await db.exec('set role authenticated');
    await db.query('insert into messages(sender_id,receiver_id,content) values($1,$2,$3)',[alice,bob,'Nice teamwork']);
    await assert.rejects(db.query('insert into messages(sender_id,receiver_id,content) values($1,$2,$3)',[bob,alice,'spoof']),/row-level security/);
    await assert.rejects(db.query('update messages set content=$1',['edited']),/permission denied/);
    await assert.rejects(db.query('update messages set receiver_id=$1',[eve]),/permission denied/);
    assert.equal((await db.query('update messages set read=true returning read')).rows.length,0);
    await db.query("select set_config('test.uid',$1,false)",[eve]);
    assert.equal((await db.query('select * from messages')).rows.length,0);
    assert.equal((await db.query('delete from messages returning id')).rows.length,0);
    await db.query("select set_config('test.uid',$1,false)",[bob]);
    assert.equal((await db.query('update messages set read=true returning read')).rows[0].read,true);
    assert.equal((await db.query('delete from messages returning id')).rows.length,0);
    await db.query("select set_config('test.uid',$1,false),set_config('test.blocked','true',false)",[alice]);
    await assert.rejects(db.query('insert into messages(sender_id,receiver_id,content) values($1,$2,$3)',[alice,bob,'blocked']),/row-level security/);
    await db.exec('reset role;set role anon');await assert.rejects(db.query('select * from messages'),/permission denied/);
  } finally {await db.close();}
});

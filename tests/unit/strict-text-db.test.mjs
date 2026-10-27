import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('strict text guard blocks direct inserts/edits while preserving receipts and RLS',async()=>{
  const db=new PGlite();
  try {
    await db.exec(`create role anon;create role authenticated;create schema clipt_private;
      create table content_filters(word text,action_type text);
      create table messages(id int,content text,owner text,read boolean default false);
      create table posts(id int,content text);create table comments(id int,content text);
      create table group_messages(id int,content text);
      create table stream_chat(id int,message text);
      alter table messages enable row level security;
      create policy own on messages to authenticated using(owner=current_setting('test.owner',true)) with check(owner=current_setting('test.owner',true));
      grant select,insert,update on messages,posts,comments,stream_chat,group_messages to authenticated;
      insert into content_filters values('custom banned phrase','block'),('b@dphrase','block');`);
    await db.exec(await readFile(new URL('../../database/strict_text_content_guard.sql',import.meta.url),'utf8'));
    await db.query("insert into content_filters values($1,'block')",['\u200b']);
    await db.exec("set role authenticated;select set_config('test.owner','alice',false)");
    await db.query('insert into messages(id,content,owner) values(1,$1,$2)',['Great game! Nice teamwork.','alice']);
    for(const content of ['ＦＵＣＫ','sh1t','f\u200buck','f.u.c.k','custom banned phrase','badphrase','heil hitler','nigg'+'er']) {
      for(const table of ['messages','posts','comments','stream_chat','group_messages']) {
        const column=table==='stream_chat'?'message':'content';
        const owner=table==='messages'?",'alice'":'';
        await assert.rejects(db.query(`insert into ${table}(id,${column}${table==='messages'?',owner':''}) values(2,$1${owner})`,[content]),/community rules/);
      }
    }
    await assert.rejects(db.query("update messages set content='shit' where id=1"),/community rules/);
    await db.exec('update messages set read=true where id=1');
    assert.equal((await db.query('select read from messages where id=1')).rows[0].read,true);
    await assert.rejects(db.query("insert into messages values(3,'Hello','bob',false)"),/row-level security/);
    await db.exec("select set_config('test.owner','bob',false)");
    assert.equal((await db.query('select * from messages')).rows.length,0);
  } finally {await db.close();}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('staged worker transport is disabled by default and refuses inherited/column credential exposure',async()=>{
 const db=new PGlite();
 try {
  await db.exec(`create role anon;create role authenticated;create role authenticator;create role service_role;
   create schema clipt_private;create schema net;create schema vault;
   create table clipt_private.azure_dispatch_settings(singleton boolean primary key,enabled boolean);
   insert into clipt_private.azure_dispatch_settings values(true,false);
   create table net.http_request_queue(headers jsonb);create table net._http_response(content text);
   create table vault.decrypted_secrets(name text,decrypted_secret text);
   insert into vault.decrypted_secrets values('clipt_azure_worker_secret',repeat('a',64));
   create table clipt_private.test_requests(url text,headers jsonb,body jsonb,timeout_ms integer);
   create function net.http_post(url text,body jsonb,params jsonb,headers jsonb,timeout_milliseconds integer) returns bigint language plpgsql as $$
    begin insert into clipt_private.test_requests values(url,headers,body,timeout_milliseconds);return 1;end$$;
   revoke all on schema net from public;
   revoke all on function net.http_post(text,jsonb,jsonb,jsonb,integer) from public;`);
  await db.exec(await readFile(new URL('../../database/azure_worker_transport.sql',import.meta.url),'utf8'));
  assert.equal((await db.query('select clipt_private.enqueue_photo_worker_tick() id')).rows[0].id,null);
  assert.equal((await db.query('select count(*)::int n from clipt_private.test_requests')).rows[0].n,0);
  await db.exec('update clipt_private.azure_dispatch_settings set enabled=true');
  for(const grant of ['grant usage on schema net to anon','grant execute on function net.http_post(text,jsonb,jsonb,jsonb,integer) to authenticated','grant select(headers) on net.http_request_queue to authenticator','grant select on vault.decrypted_secrets to anon']){
   await db.exec('begin');await db.exec(grant);
   await assert.rejects(db.query('select clipt_private.enqueue_photo_worker_tick()'),/Untrusted/);await db.exec('rollback');
  }
  assert.equal((await db.query('select count(*)::int n from clipt_private.test_requests')).rows[0].n,0);
  assert.equal(Number((await db.query('select clipt_private.enqueue_photo_worker_tick() id')).rows[0].id),1);
  const row=(await db.query('select url,body,timeout_ms from clipt_private.test_requests')).rows[0];
  assert.equal(row.url,'https://akiksrlzdqvipqbbjxpw.supabase.co/functions/v1/process-photo-reviews');assert.deepEqual(row.body,{});assert.equal(row.timeout_ms,30000);
  await db.exec('set role authenticated');await assert.rejects(db.query('select clipt_private.enqueue_photo_worker_tick()'),/permission denied/);
 }finally{await db.close();}
});

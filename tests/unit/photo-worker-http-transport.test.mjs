import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('private synchronous worker transport has no credential queue and fails closed',async()=>{
 const db=new PGlite();
 try {
  await db.exec(`create role anon;create role authenticated;create role authenticator;create role service_role;
   create schema clipt_private;create schema clipt_http;create schema vault;
   create table clipt_private.azure_dispatch_settings(singleton boolean,enabled boolean);
   insert into clipt_private.azure_dispatch_settings values(true,false);
   create table vault.decrypted_secrets(name text,decrypted_secret text);
   insert into vault.decrypted_secrets values('clipt_azure_worker_secret',repeat('a',64));
   create type clipt_http.http_header as (field varchar,value varchar);
   create type clipt_http.http_request as (method varchar,uri varchar,headers clipt_http.http_header[],content_type varchar,content varchar);
   create type clipt_http.http_response as (status integer,content_type varchar,headers clipt_http.http_header[],content varchar);
   create table clipt_private.test_http(uri text,body text);
   create function clipt_http.http_reset_curlopt() returns boolean language sql as $$select true$$;
   create function clipt_http.http_set_curlopt(varchar,varchar) returns boolean language sql as $$select true$$;
   create function clipt_http.http(r clipt_http.http_request) returns clipt_http.http_response language plpgsql as $$begin
    insert into clipt_private.test_http values(r.uri,r.content);
    return row(503,'application/json',null,'{"error":"Automatic photo review is disabled"}')::clipt_http.http_response;end$$;
   revoke all on all functions in schema clipt_http from public;`);
  await db.exec(await readFile(new URL('../../database/azure_worker_http_transport.sql',import.meta.url),'utf8'));
  const tick=async(probe=false)=>(await db.query('select clipt_private.photo_worker_http_tick($1) r',[probe])).rows[0].r;
  assert.deepEqual(await tick(),{state:'disabled'});
  assert.equal((await db.query('select count(*)::int n from clipt_private.test_http')).rows[0].n,0);
  for(const grant of ['grant usage on schema clipt_http to anon','grant create on schema clipt_http to authenticated','grant select(decrypted_secret) on vault.decrypted_secrets to authenticator']){
   await db.exec('begin');await db.exec(grant);assert.deepEqual(await tick(true),{state:'unsafe_transport'});await db.exec('rollback');
  }
  // A retained function ACL without namespace access is not reachability.
  await db.exec('grant execute on all functions in schema clipt_http to public');
  for(const role of ['anon','authenticated','authenticator']){
   await db.exec(`set role ${role}`);
   await assert.rejects(db.exec('select clipt_http.http_reset_curlopt()'),/permission denied/);
   await db.exec('reset role');
  }
  assert.deepEqual(await tick(true),{state:'worker_disabled',http_status:503});
  assert.deepEqual((await db.query('select * from clipt_private.test_http')).rows,[{uri:'https://akiksrlzdqvipqbbjxpw.supabase.co/functions/v1/process-photo-reviews',body:'{}'}]);
  await db.exec('set role authenticated');await assert.rejects(tick(true),/permission denied/);await db.exec('reset role');
  await db.exec("create or replace function clipt_http.http(r clipt_http.http_request) returns clipt_http.http_response language plpgsql as $$begin raise exception 'sensitive provider text';end$$");
  assert.deepEqual(await tick(true),{state:'transport_unconfirmed'});
 }finally{await db.close();}
});

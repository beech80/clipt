import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('creator identity occupies its own row above safety actions on narrow screens',async()=>{
 const source=await readFile(new URL('../../src/pages/UserProfile.tsx',import.meta.url),'utf8');
 assert.match(source,/className="min-w-0 basis-full"/);
});
test('mute records are owner-private and erased with deleted identities',async()=>{
 const db=new PGlite();try{
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema clipt_private;
   create table auth.users(id uuid primary key,aud text,role text);create table profiles(id uuid primary key references auth.users(id));
   create table clipt_private.erasure_tables(table_oid oid primary key,table_name text);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create function clipt_private.account_available() returns boolean language sql stable security definer as $$select exists(select 1 from public.profiles where id=auth.uid())$$;
   grant usage on schema auth,clipt_private to authenticated;`);
  await db.exec(await readFile(new URL('../../supabase/migrations/20261016122735_owner_scoped_creator_mutes.sql',import.meta.url),'utf8'));
  const results=await db.exec(await readFile(new URL('../fixtures/hosted-owner-mutes.sql',import.meta.url),'utf8'));
  assert.match(results.at(-1).rows[0].result,/PASS:/);
 }finally{await db.close();}
});
test('feed waits for mute preferences and discards cached rows when privacy preferences fail',async()=>{
 const source=await readFile(new URL('../../src/pages/Clipts.tsx',import.meta.url),'utf8');
 assert.match(source,/\(!user \|\| muted\.isSuccess\)/);
 assert.match(source,/user && !muted\.isSuccess \? \[\]/);
 assert.match(source,/request=request\.not\('user_id','in'/);
});

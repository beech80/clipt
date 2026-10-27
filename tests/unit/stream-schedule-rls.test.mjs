import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('stream schedule policies enforce ownership, privacy, blocking, dates, duplicate prevention and deletion cleanup',async()=>{
 const db=new PGlite();
 try {
  await db.exec(`create role anon; create role authenticated;
   create schema auth; create schema clipt_private;
   create table auth.users(id uuid primary key,aud text,role text);
   create table public.profiles(id uuid primary key references auth.users(id));
   create table public.games(id uuid primary key);
   create table public.user_blocks(blocker_id uuid,blocked_id uuid);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create function clipt_private.account_available() returns boolean language sql stable security definer as $$select exists(select 1 from public.profiles where id=auth.uid()) and coalesce(current_setting('test.mfa_denied',true),'false')<>'true'$$;
   create function clipt_private.blocked_with(other_user uuid) returns boolean language sql stable security definer as $$select exists(select 1 from public.user_blocks where (blocker_id=auth.uid() and blocked_id=other_user) or (blocked_id=auth.uid() and blocker_id=other_user))$$;
   grant usage on schema auth,clipt_private to authenticated;`);
  await db.exec(await readFile(new URL('../../supabase/migrations/20261016110938_secure_stream_schedules.sql',import.meta.url),'utf8'));
  const result=await db.exec(await readFile(new URL('../fixtures/hosted-stream-schedule-rls.sql',import.meta.url),'utf8'));
  assert.match(result.at(-1).rows[0].result,/PASS:/);
  assert.equal((await db.query('select count(*)::int n from public.scheduled_streams')).rows[0].n,0);
  await db.exec(`begin; insert into auth.users values('11111111-1111-4111-8111-111111111111','authenticated','authenticated');
   insert into profiles values('11111111-1111-4111-8111-111111111111');
   set local request.jwt.claim.sub='11111111-1111-4111-8111-111111111111'; set local test.mfa_denied='true'; set local role authenticated;`);
  await assert.rejects(db.exec(`insert into scheduled_streams(user_id,title,scheduled_start) values('11111111-1111-4111-8111-111111111111','MFA fixture',now()+interval '1 day')`),/row-level security/);
  await db.exec('rollback');
  await db.exec(`begin; insert into auth.users values('11111111-1111-4111-8111-111111111111','authenticated','authenticated');
   insert into profiles values('11111111-1111-4111-8111-111111111111');
   set local request.jwt.claim.sub='11111111-1111-4111-8111-111111111111'; set local role authenticated;
   insert into scheduled_streams(user_id,title,scheduled_start)
    select '11111111-1111-4111-8111-111111111111','Limit fixture',now()+n*interval '1 hour' from generate_series(1,50) n;`);
  await assert.rejects(db.exec(`insert into scheduled_streams(user_id,title,scheduled_start) values('11111111-1111-4111-8111-111111111111','Excess fixture',now()+interval '4 days')`),/Upcoming schedule limit reached/);
  await db.exec('rollback');
 } finally {await db.close();}
});

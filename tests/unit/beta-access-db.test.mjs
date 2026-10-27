import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { preparePrivateMediaBoundary } from '../../scripts/private-media-release.mjs';

test('explicit beta membership intersects visibility, ownership and MFA without client roster access', async () => {
  const db = new PGlite();
  const owner='00000000-0000-4000-8000-000000000001';
  const outsider='00000000-0000-4000-8000-000000000002';
  try {
    await db.exec(`create role anon; create role authenticated;
      create schema auth; create schema clipt_private; create schema storage;
      grant usage on schema auth,clipt_private,storage,public to anon,authenticated;
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
      create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('aal',coalesce(nullif(current_setting('test.aal',true),''),'aal1'))$$;
      create table auth.users(id uuid primary key,email_confirmed_at timestamptz,is_anonymous boolean default false);
      create table auth.mfa_factors(user_id uuid,status text);
      create table public.profiles(id uuid primary key);
      create table public.posts(user_id uuid,content text);
      create table storage.objects(owner_id uuid);
      alter table public.profiles enable row level security;
      alter table public.posts enable row level security;
      alter table storage.objects enable row level security;
      grant select on public.profiles,public.posts,storage.objects to anon,authenticated;
      grant insert on public.posts to authenticated;
      create policy existing_profiles on public.profiles for select using(true);
      create policy existing_posts on public.posts for select using(true);
      create policy existing_write on public.posts for insert to authenticated with check(user_id=auth.uid());
      create policy existing_storage on storage.objects for select using(true);`);
    await db.query('insert into auth.users values($1,now(),false),($2,now(),false)',[owner,outsider]);
    await db.query('insert into public.profiles values($1),($2)',[owner,outsider]);
    await db.query("insert into public.posts values($1,'public fixture')",[owner]);
    await db.query('insert into storage.objects values($1)',[owner]);
    await db.exec(await readFile(new URL('../../supabase/release/beta-access.sql',import.meta.url),'utf8'));
    const role=async(uid='',aal='aal1')=>{
      await db.exec('reset role');
      await db.query("select set_config('test.uid',$1,false),set_config('test.aal',$2,false)",[uid,aal]);
      await db.exec(`set role ${uid?'authenticated':'anon'}`);
    };
    const count=async(table)=>(await db.query(`select count(*)::int as n from ${table}`)).rows[0].n;
    await role();assert.equal(await count('public.posts'),1,'staging install remains inactive');
    await db.exec('reset role');await db.exec('update clipt_private.beta_access_config set enabled=true');
    await role();assert.equal(await count('public.posts'),0);assert.equal(await count('storage.objects'),0);
    await role(outsider);assert.equal(await count('public.posts'),0,'existing account is not approval');
    await assert.rejects(db.query('select * from clipt_private.beta_members'));
    await assert.rejects(db.query('insert into clipt_private.beta_members(user_id) values($1)',[outsider]));
    await db.exec('reset role');await db.query('insert into clipt_private.beta_members(user_id) values($1)',[owner]);
    await role(owner);assert.equal(await count('public.posts'),1);assert.equal(await count('storage.objects'),1);
    await assert.rejects(db.query("insert into public.posts values($1,'spoof')",[outsider]));
    assert.equal((await db.query('select clipt_private.account_available() as ok')).rows[0].ok,true);
    await db.exec('reset role');await db.query("insert into auth.mfa_factors values($1,'verified')",[owner]);
    await role(owner);assert.equal((await db.query('select clipt_private.account_available() as ok')).rows[0].ok,false);
    await role(owner,'aal2');assert.equal((await db.query('select clipt_private.account_available() as ok')).rows[0].ok,true);
    await db.exec('reset role');await db.exec('update clipt_private.beta_members set revoked_at=now()');
    await role(owner,'aal2');assert.equal(await count('public.posts'),0,'revocation does not wait for JWT refresh');
    await db.exec('reset role');await db.exec("update clipt_private.beta_members set revoked_at=null,expires_at=now()-interval '1 second'");
    await role(owner);assert.equal(await count('public.posts'),0);
    await db.exec('reset role');await db.exec('delete from clipt_private.beta_access_config');
    await role(owner);assert.equal(await count('public.posts'),0,'missing configuration fails closed');
  } finally {await db.close();}
});

test('private-media release preparation is project-scoped and never toggles bucket visibility',async()=>{
  const sql=await preparePrivateMediaBoundary('slnjliheyiiummxhrgmk');
  assert.match(sql,/https:\/\/slnjliheyiiummxhrgmk\.supabase\.co/);
  assert.doesNotMatch(sql,/akiksrlzdqvipqbbjxpw/);
  assert.match(sql,/SECURITY INVOKER/);
  assert.match(sql,/AS RESTRICTIVE FOR SELECT/);
  assert.doesNotMatch(sql,/UPDATE storage\.buckets|DELETE FROM storage\.objects|DROP.*CASCADE/i);
  await assert.rejects(preparePrivateMediaBoundary('unreviewed'));
});

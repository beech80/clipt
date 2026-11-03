import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
test('verified self-service signup preserves private data, account restrictions, MFA and rollback',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`
   create role anon;create role authenticated;create role service_role bypassrls;create role authenticator;
   create schema auth;create schema clipt_private;create schema storage;
   grant usage on schema auth,clipt_private,storage,public to anon,authenticated,service_role;
   create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create function auth.jwt()returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
   create table auth.users(id uuid primary key,email_confirmed_at timestamptz,is_anonymous boolean default false,deleted_at timestamptz,banned_until timestamptz);
   create table auth.mfa_factors(user_id uuid,status text);
   create table public.profiles(id uuid primary key);
   create table public.posts(id uuid primary key,user_id uuid,is_published boolean,moderation_hidden boolean,content text);
   create table storage.objects(owner_id uuid);
   alter table public.profiles enable row level security;alter table public.posts enable row level security;alter table storage.objects enable row level security;
   grant select on public.profiles,public.posts,storage.objects to anon,authenticated;
   grant insert on public.posts to authenticated;
   create policy profiles_read on profiles for select using(true);
   create policy post_read on posts for select using(user_id=auth.uid() or(is_published and not moderation_hidden));
   create policy post_write on posts for insert to authenticated with check(user_id=auth.uid());
   create policy storage_read on storage.objects for select using(owner_id=auth.uid());
  `);
  for(const n of [1,2,3]){
   await db.query('insert into auth.users values($1,now(),false,null,null)',[id(n)]);
   await db.query('insert into profiles values($1)',[id(n)]);
   await db.query('insert into storage.objects values($1)',[id(n)]);
  }
  await db.query("insert into posts values($1,$2,true,false,'Public'),($3,$2,false,false,'Private'),($4,$2,true,true,'Held')",[id(11),id(1),id(12),id(13)]);
  for(const path of ['beta-access.sql','beta-live-auth-status.sql','beta-api-admission.sql'])
   await db.exec(await readFile(new URL('../../supabase/release/'+path,import.meta.url),'utf8'));
  await db.exec('update clipt_private.beta_access_config set enabled=true where singleton');
  await db.query('insert into clipt_private.beta_members(user_id)values($1)',[id(1)]);
  const sql=await readFile(new URL('../../supabase/release/open-beta-access.sql',import.meta.url),'utf8');
  await db.exec(sql);
  const as=async(role,who,query,params=[],aal='aal1',requestPath='/posts')=>{
   await db.exec('reset role');
   await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false),set_config('request.path',$3,false),set_config('request.method','POST',false)",
    [who??'',JSON.stringify({aal,user_metadata:{approved:true,role:'service_role'}}),requestPath]);
   await db.exec('set role '+role);
   try{return await db.query(query,params);}finally{await db.exec('reset role');}
  };
  const allowed=async(who)=> (await as(who?'authenticated':'anon',who,'select public.clipt_beta_access() ok')).rows[0].ok;
  assert.equal((await db.query('select allow_verified_signups from clipt_private.beta_access_config')).rows[0].allow_verified_signups,false);
  assert.equal(await allowed(id(1)),true);assert.equal(await allowed(id(2)),false,'install does not silently activate');
  await db.exec('update clipt_private.beta_access_config set allow_verified_signups=true where singleton and enabled');
  assert.equal(await allowed(id(2)),true,'confirmed account needs no manual membership');
  assert.equal((await db.query('select count(*)::int n from clipt_private.beta_members')).rows[0].n,1,'no roster rows are manufactured');
  assert.equal(await allowed(null),false,'anonymous access stays denied');
  assert.deepEqual((await as('authenticated',id(2),'select id from posts order by id')).rows.map(x=>x.id),[id(11)],'private and held posts remain private');
  assert.equal((await as('authenticated',id(2),'select count(*)::int n from storage.objects')).rows[0].n,1,'other users storage remains private');
  await as('authenticated',id(2),"insert into posts values($1,$2,true,false,'Own post')",[id(14),id(2)]);
  await assert.rejects(as('authenticated',id(2),"insert into posts values($1,$2,true,false,'Spoof')",[id(15),id(1)]),/row-level security/);
  for(const table of ['beta_access_config','beta_members']){
   await assert.rejects(as('authenticated',id(2),'select * from clipt_private.'+table),/permission denied/);
  }
  await assert.rejects(as('authenticated',id(2),'insert into clipt_private.beta_members(user_id) values($1)',[id(2)]),/permission denied/);
  for(const [field,value] of [['email_confirmed_at','null'],['is_anonymous','true'],['deleted_at','now()'],['banned_until',"now()+interval '1 hour'"]]){
   await db.exec('update auth.users set '+field+'='+value+" where id='"+id(2)+"'");
   assert.equal(await allowed(id(2)),false,field+' remains authoritative despite spoofed metadata');
   await db.query('update auth.users set email_confirmed_at=now(),is_anonymous=false,deleted_at=null,banned_until=null where id=$1',[id(2)]);
  }
  await db.query('insert into clipt_private.beta_members(user_id,revoked_at)values($1,now())',[id(2)]);
  assert.equal(await allowed(id(2)),false,'explicit revocation wins over automatic admission');
  await db.query("update clipt_private.beta_members set revoked_at=null,expires_at=now()-interval '1 second' where user_id=$1",[id(2)]);
  assert.equal(await allowed(id(2)),false,'explicit expiry is retained');
  await db.query('delete from clipt_private.beta_members where user_id=$1',[id(2)]);
  await db.query("insert into auth.mfa_factors values($1,'verified')",[id(2)]);
  assert.equal((await as('authenticated',id(2),'select clipt_private.account_available() ok')).rows[0].ok,false);
  await assert.rejects(as('authenticated',id(2),'select clipt_private.enforce_beta_api_request()'),/enrolled MFA/);
  await as('authenticated',id(2),'select clipt_private.enforce_beta_api_request()',[],'aal2');
  await assert.rejects(as('anon',null,'select clipt_private.enforce_beta_api_request()'),/verified account/);
  await as('anon',null,'select clipt_private.enforce_beta_api_request()',[],'aal1','/rpc/clipt_beta_access');
  await as('service_role',null,'select clipt_private.enforce_beta_api_request()');
  await db.exec(sql);
  assert.equal(await allowed(id(3)),true,'reinstall does not reset an activated mode');
  await db.exec('update clipt_private.beta_access_config set allow_verified_signups=false where singleton');
  assert.equal(await allowed(id(3)),false,'rollback restores manual admission');assert.equal(await allowed(id(1)),true,'owner access retained');
  await db.exec('delete from clipt_private.beta_access_config where singleton');assert.equal(await allowed(id(1)),false,'missing config fails closed');
 }finally{await db.close();}
});

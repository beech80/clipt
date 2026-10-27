import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('live beta admission rejects banned, deleted, unconfirmed and revoked identities with existing claims',async()=>{
  const db=new PGlite();
  const id='00000000-0000-4000-8000-000000000081';
  try{
    await db.exec(`create role anon;create role authenticated;create schema auth;create schema clipt_private;
      grant usage on schema auth,clipt_private to anon,authenticated;
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
      create table auth.users(id uuid primary key,email_confirmed_at timestamptz,is_anonymous boolean,deleted_at timestamptz,banned_until timestamptz);
      create table clipt_private.beta_access_config(singleton boolean,enabled boolean);
      create table clipt_private.beta_members(user_id uuid,revoked_at timestamptz,expires_at timestamptz);
      create function clipt_private.beta_access_allowed() returns boolean language sql as $$select false$$;
      revoke all on function clipt_private.beta_access_allowed() from public;
      grant execute on function clipt_private.beta_access_allowed() to anon,authenticated;
      insert into clipt_private.beta_access_config values(true,true);
      insert into auth.users values('${id}',now(),false,null,null);
      insert into clipt_private.beta_members values('${id}',null,null);`);
    await db.exec(await readFile(new URL('../../supabase/release/beta-live-auth-status.sql',import.meta.url),'utf8'));
    const allowed=async()=>{await db.exec('set role authenticated');try{return(await db.query('select clipt_private.beta_access_allowed() as ok')).rows[0].ok;}finally{await db.exec('reset role');}};
    await db.query("select set_config('test.uid',$1,false)",[id]);
    assert.equal(await allowed(),true);
    for(const [field,value] of [['banned_until',"now()+interval '1 hour'"],['deleted_at','now()'],['email_confirmed_at','null'],['is_anonymous','true']]){
      await db.exec(`update auth.users set ${field}=${value}`);
      assert.equal(await allowed(),false,field+' must deny unchanged claims');
      await db.exec('update auth.users set banned_until=null,deleted_at=null,email_confirmed_at=now(),is_anonymous=false');
    }
    await db.exec("update auth.users set banned_until=now()-interval '1 second'");assert.equal(await allowed(),true);
    await db.exec('update clipt_private.beta_members set revoked_at=now()');assert.equal(await allowed(),false);
    await db.exec("update clipt_private.beta_members set revoked_at=null,expires_at=now()-interval '1 second'");assert.equal(await allowed(),false);
    await db.exec('delete from clipt_private.beta_access_config');assert.equal(await allowed(),false);
  }finally{await db.close();}
});

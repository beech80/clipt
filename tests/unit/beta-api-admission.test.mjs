import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('Data API guard covers RPCs, retains admission checks and server rights, and cannot be bypassed by metadata',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role;create role authenticator;
   create schema clipt_private;grant usage on schema clipt_private to anon,authenticated,service_role;
   create function clipt_private.beta_access_allowed() returns boolean language sql stable as $$
     select coalesce(nullif(current_setting('test.invited',true),''),'false')::boolean$$;
   create function clipt_private.account_available() returns boolean language sql stable as $$
     select coalesce(nullif(current_setting('test.account',true),''),'false')::boolean$$;
   revoke all on function clipt_private.account_available() from public,anon;
   grant execute on function clipt_private.account_available() to authenticated;
   create function public.clipt_beta_access() returns boolean language sql as $$select clipt_private.beta_access_allowed()$$;`);
  await db.exec(await readFile(new URL('../../supabase/release/beta-api-admission.sql',import.meta.url),'utf8'));
  const claim=async(role,{invited=false,account=false,path='/rpc/get_top_clipts',method='POST'}={})=>{
   await db.exec('reset role');
   await db.query("select set_config('test.invited',$1,false),set_config('test.account',$2,false),set_config('request.path',$3,false),set_config('request.method',$4,false),set_config('request.jwt.claims',$5,false)",
     [String(invited),String(account),path,method,JSON.stringify({user_metadata:{role:'service_role',approved:true}})]);
   await db.exec('set role '+role);
  };
  for(const role of ['anon','authenticated']){
   for(const path of ['/rpc/get_top_clipts','/rpc/calculate_gaming_metrics','/posts','/profiles']){
    await claim(role,{path});await assert.rejects(db.query('select clipt_private.enforce_beta_api_request()'),/beta invitation is required/);
   }
   await claim(role,{path:'/rpc/clipt_beta_access'});await db.query('select clipt_private.enforce_beta_api_request()');
   assert.equal((await db.query('select public.clipt_beta_access() as ok')).rows[0].ok,false);
  }
  await claim('authenticated',{invited:true,account:false});
  await assert.rejects(db.query('select clipt_private.enforce_beta_api_request()'),/enrolled MFA required/);
  await claim('authenticated',{invited:true,account:true});await db.query('select clipt_private.enforce_beta_api_request()');
  await claim('anon',{invited:true});await db.query('select clipt_private.enforce_beta_api_request()');
  await claim('service_role');await db.query('select clipt_private.enforce_beta_api_request()');
  await claim('anon',{method:'OPTIONS'});await db.query('select clipt_private.enforce_beta_api_request()');
  await claim('authenticated',{path:'/rpc/clipt_beta_access_extra'});
  await assert.rejects(db.query('select clipt_private.enforce_beta_api_request()'),/beta invitation is required/);
  await db.exec('reset role');
  assert.equal((await db.query("select prosecdef as definer from pg_proc where oid='clipt_private.enforce_beta_api_request()'::regprocedure")).rows[0].definer,false);
  assert.equal((await db.query("select count(*)::int n from pg_db_role_setting s join pg_roles r on r.oid=s.setrole,unnest(s.setconfig) v where r.rolname='authenticator' and v='pgrst.db_pre_request=clipt_private.enforce_beta_api_request'")).rows[0].n,1);
 }finally{await db.close();}
});

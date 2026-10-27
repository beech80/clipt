import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';

test('receipt-bound billing deletion executes actual SQL without deleting another account',async t=>{
 const db=new PGlite(),owner=randomUUID(),other=randomUUID(),request=randomUUID(),receipt='a'.repeat(64);
 try {
  // Reuse the checked-in billing contract schema, not a second implementation.
  const fixture=await readFile(new URL('./subscription-lifecycle-db.test.mjs',import.meta.url),'utf8');
  const setup=fixture.match(/await db\.exec\(`([\s\S]*?)`\);/)[1];
  assert.ok(!setup.includes('${'));await db.exec(setup);
  await db.exec(`create table clipt_private.erasure_jobs(id uuid primary key,user_id uuid,subject_id uuid,state text);
   create table clipt_private.erasure_policy(singleton boolean,financial_years integer);insert into clipt_private.erasure_policy values(true,7);
   create table clipt_private.retained_records(subject_id uuid,category text,source_table text,source_id text,data jsonb,expires_at timestamptz,unique(source_table,source_id));`);
  await db.exec(await readFile(new URL('../../database/sandbox_subscription_lifecycle.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../../database/sandbox_billing_erasure.sql',import.meta.url),'utf8'));
  await db.query('insert into auth.users values($1),($2)',[owner,other]);await db.query('insert into profiles values($1),($2)',[owner,other]);
  const cmd=(stage,user=owner,token=receipt,proof=null,id=request)=>db.query('select public.sandbox_billing_erasure($1,$2,$3,$4,$5) value',[stage,user,id,token,proof]);
  const billing=(action,payload)=>db.query('select public.sandbox_billing_command($1,$2) value',[action,payload]);
  await t.test('client roles cannot reserve deletion or inspect billing receipts',async()=>{
   for(const role of ['anon','authenticated']) {
    await db.exec('set role '+role);await assert.rejects(cmd('prepare'),/permission denied/);
    await assert.rejects(db.query('select * from clipt_private.billing_erasure_requests'),/permission denied/);await db.exec('reset role');
   }
  });
  await t.test('unsubscribed account and unknown resume produce no provider reservation',async()=>{
   assert.equal((await cmd('prepare')).rows[0].value,null);assert.equal((await cmd('prepare',null)).rows[0].value,null);
  });
  const checkout=randomUUID();
  await billing('reserve',{user_id:owner,request_id:checkout,plan:'premium'});
  await t.test('unbound in-flight checkout also prevents provider orphaning during deletion',async()=>{
   await assert.rejects(cmd('prepare'),/pending billing/);
   await assert.rejects(db.query('delete from profiles where id=$1',[owner]),/pending billing/);
  });
  await billing('bind',{user_id:owner,request_id:checkout,customer_id:'cus_fixture',session_id:'cs_test_fixture',session_url:'https://checkout.stripe.com/c/fixture'});
  await t.test('pending checkout blocks deletion before any provider action',async()=>{
   await assert.rejects(cmd('prepare'),/pending billing/);
   assert.equal((await db.query('select count(*)::int n from clipt_private.billing_erasure_requests')).rows[0].n,0);
  });
  await billing('release',{user_id:owner,session_id:'cs_test_fixture'});
  await db.query("update clipt_private.billing_accounts set subscription_id='sub_fixture',provider_status='active' where user_id=$1",[owner]);
  await t.test('original receipt replays and foreign owner/receipt cannot use reservation',async()=>{
   assert.equal((await cmd('prepare')).rows[0].value.state,'reserved');
   assert.equal((await cmd('prepare',null)).rows[0].value.user_id,owner);
   await assert.rejects(cmd('prepare',other),/receipt rejected/);
   await assert.rejects(cmd('prepare',null,'b'.repeat(64)),/receipt rejected/);
   await assert.rejects(cmd('prepare',owner,receipt,null,randomUUID()),/duplicate key/);
  });
  await t.test('frozen billing denies new checkout and management without consuming a request',async()=>{
   await assert.rejects(billing('management_reserve',{user_id:owner,request_id:randomUUID(),action:'cancel'}),/deletion in progress/);
   await db.query("update clipt_private.billing_accounts set provider_status='canceled' where user_id=$1",[owner]);
   await assert.rejects(billing('reserve',{user_id:owner,request_id:randomUUID(),plan:'premium'}),/deletion in progress/);
  });
  await t.test('missing or mismatched provider proof keeps profile and financial data intact',async()=>{
   await assert.rejects(cmd('verify'),/unconfirmed/);
   await assert.rejects(cmd('verify',null,receipt,{customer_id:'cus_other',subscription_id:'sub_fixture',status:'canceled'}),/unconfirmed/);
   await assert.rejects(db.query('delete from profiles where id=$1',[owner]),/cleanup required/);
  });
  const proof={customer_id:'cus_fixture',subscription_id:'sub_fixture',status:'canceled'};
  await t.test('provider proof is idempotent but cannot erase without matching original erasure job',async()=>{
   assert.equal((await cmd('verify',null,receipt,proof)).rows[0].value.state,'verified');
   assert.equal((await cmd('verify',null,receipt,proof)).rows[0].value.state,'verified');
   await assert.rejects(db.query('delete from profiles where id=$1',[owner]),/cleanup required/);
  });
  await t.test('verified deletion retains minimized accounting and clears all identity-linked billing',async()=>{
   await db.query("insert into clipt_private.erasure_jobs values($1,$2,$3,'cleanup')",[request,owner,randomUUID()]);
   await db.query('delete from profiles where id=$1',[owner]);
   await db.query('delete from auth.users where id=$1',[owner]);
   assert.equal((await db.query('select count(*)::int n from profiles where id=$1',[other])).rows[0].n,1);
   const retained=(await db.query('select * from clipt_private.retained_records')).rows[0];
   assert.equal(retained.data.status,'canceled');
   for(const value of [owner,'cus_fixture','sub_fixture',receipt])assert.ok(!JSON.stringify(retained).includes(value));
   assert.ok(Date.parse(retained.expires_at)>Date.now()+6*365*86400000);
   assert.equal((await cmd('prepare',null)).rows[0].value,null);
   const reservation=(await db.query('select * from clipt_private.billing_erasure_requests')).rows[0];
   assert.equal(reservation.user_id,null);assert.equal(reservation.customer_id,'erased');assert.equal(reservation.subscription_id,null);
   assert.equal((await billing('reconcile',{event_id:'evt_late',event_created:1,snapshot:{user_id:owner,subscription_id:'sub_fixture',customer_id:'cus_fixture',status:'active'}})).rows[0].value,false);
   assert.equal((await db.query('select count(*)::int n from clipt_private.billing_accounts')).rows[0].n,0);
   await assert.rejects(billing('reserve',{user_id:owner,request_id:randomUUID(),plan:'premium'}),/Account unavailable/);
   await db.query('delete from clipt_private.erasure_jobs where id=$1',[request]);
   assert.equal((await db.query('select count(*)::int n from clipt_private.billing_erasure_requests')).rows[0].n,0);
  });
 } finally {await db.close();}
});

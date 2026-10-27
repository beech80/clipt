import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import ts from 'typescript';

const sql = await readFile(new URL('../../supabase/release/operational-alerts.sql', import.meta.url), 'utf8');
const owner='00000000-0000-4000-8000-000000000071';
const reporter='00000000-0000-4000-8000-000000000072';
const other='00000000-0000-4000-8000-000000000073';

test('operations alerts enforce recipient ownership, staff access, quotas, deduplication and retention', async () => {
  const db=new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated;
      create schema auth; create schema clipt_private; create schema cron;
      grant usage on schema auth,clipt_private,public to anon,authenticated;
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
      create function clipt_private.account_available() returns boolean language sql stable as $$
        select auth.uid() is not null and coalesce(nullif(current_setting('test.allowed',true),''),'true')::boolean$$;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,is_anonymous boolean default false,
        deleted_at timestamptz,banned_until timestamptz);
      create table public.profiles(id uuid primary key references auth.users(id));
      create table public.user_roles(user_id uuid,role text);
      create type public.notification_type as enum('system_alert');
      create table public.notifications(id uuid primary key default gen_random_uuid(),user_id uuid,actor_id uuid,
        type public.notification_type,content text,resource_id uuid,resource_type text,created_at timestamptz default now());
      alter table public.notifications enable row level security;
      grant select on public.notifications to authenticated;
      create policy own_notification on public.notifications for select to authenticated using(user_id=auth.uid());
      create table cron.job(jobid bigint primary key,jobname text,active boolean);
      create table cron.job_run_details(jobid bigint,status text,start_time timestamptz);`);
    for (const [id,email] of [[owner,'beecher@cliptgaming.com'],[reporter,'reporter@example.invalid'],[other,'other@example.invalid']]) {
      await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[id,email]);
      await db.query('insert into public.profiles values($1)',[id]);
    }
    await db.query("insert into public.user_roles values($1,'moderator')",[owner]);
    await db.exec(sql);
    const role=async(id,allowed=true)=>{
      await db.exec('reset role');
      await db.query("select set_config('test.uid',$1,false),set_config('test.allowed',$2,false)",[id??'',String(allowed)]);
      await db.exec(`set role ${id?'authenticated':'anon'}`);
    };
    await role(null);
    await assert.rejects(db.query("select public.report_operational_issue('feed')"),/permission denied/);
    await role(reporter,false);
    await assert.rejects(db.query("select public.report_operational_issue('feed')"),/Authenticated account required/);
    await role(reporter);
    await assert.rejects(db.query("select public.report_operational_issue('https://example.invalid/private?token=secret')"),/Invalid route category/);
    await assert.rejects(db.query('select * from clipt_private.operational_alert_recipients'),/permission denied/);
    await assert.rejects(db.query('select public.list_operational_alerts()'),/Moderator role required/);
    await assert.rejects(db.query('select clipt_private.check_operational_health()'),/permission denied/);
    const first=(await db.query("select public.report_operational_issue('feed') as id")).rows[0].id;
    const second=(await db.query("select public.report_operational_issue('feed') as id")).rows[0].id;
    assert.equal(first,second,'repeated screen failures aggregate');
    assert.equal((await db.query('select count(*)::int as n from public.notifications')).rows[0].n,0,'sender cannot see operator notification');
    await assert.rejects(db.query('select public.ack_operational_alert($1)',[first]),/Moderator role required/);
    // Same-statement timestamps avoid crossing a clock-minute quota boundary.
    await db.exec(`reset role; delete from clipt_private.operational_alert_rates;
      set role authenticated; do $$ begin
      for n in 1..5 loop perform public.report_operational_issue('feed'); end loop;
      begin perform public.report_operational_issue('feed'); raise exception 'quota bypass';
      exception when raise_exception then if sqlerrm <> 'Please wait before reporting again' then raise; end if; end;
      end $$;`);
    await role(owner);
    const alerts=(await db.query('select * from public.list_operational_alerts()')).rows;
    assert.equal(alerts.length,1);
    assert.equal(alerts[0].occurrences,7);
    assert.equal('actor_id' in alerts[0],false,'operator list omits reporter identity');
    const notifications=(await db.query('select * from public.notifications')).rows;
    assert.equal(notifications.length,1,'notification flood is suppressed');
    assert.equal(notifications[0].resource_type,'operational_alert');
    assert.equal(notifications[0].actor_id,null);
    assert.equal((await db.query('select public.ack_operational_alert($1) as id',[first])).rows[0].id,first);
    assert.equal((await db.query('select public.ack_operational_alert($1) as id',[first])).rows[0].id,first,'acknowledgment is idempotent');
    assert.equal((await db.query('select * from public.list_operational_alerts()')).rows[0].acknowledged,true);
    await role(other);
    await db.query("select public.report_operational_issue('feed')");
    await role(owner);
    assert.equal((await db.query('select count(*)::int as n from public.notifications')).rows[0].n,1,'different reporters do not flood recipient');
    await db.exec(`reset role;
      insert into cron.job values(1,'fixture-failed-task',true);
      insert into cron.job_run_details values(1,'failed',now());
      select clipt_private.check_operational_health();
      select clipt_private.check_operational_health();`);
    assert.equal((await db.query("select count(*)::int as n from clipt_private.operational_alerts where kind='cron_failure'")).rows[0].n,1);
    await db.exec(`insert into clipt_private.operational_alerts(kind,route_key,created_at) values('verification','other',now()-interval '15 days');
      insert into clipt_private.operational_alert_rates values('${other}',now()-interval '2 hours',1);
      select clipt_private.check_operational_health();`);
    assert.equal((await db.query("select count(*)::int as n from clipt_private.operational_alerts where created_at<now()-interval '14 days'")).rows[0].n,0);
    assert.equal((await db.query("select count(*)::int as n from clipt_private.operational_alert_rates where window_start<now()-interval '1 hour'")).rows[0].n,0);
    const bad=(await db.query(`select count(*)::int as n from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.prosecdef and (has_function_privilege('anon',p.oid,'EXECUTE') or has_function_privilege('authenticated',p.oid,'EXECUTE'))`)).rows[0].n;
    assert.equal(bad,0,'public wrappers do not bypass RLS');
  } finally { await db.close(); }
});

test('crash reporter transmits only a fixed route category and never propagates reporting failure', async () => {
  const source=await readFile(new URL('../../src/lib/operational-alerts.ts',import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  const calls=[]; const exports={};
  const client={rpc:(name,args)=>{calls.push({name,args});return{retry:()=>Promise.reject(new Error('private backend detail'))}}};
  new Function('require','exports',compiled)(()=>({supabase:client}),exports);
  await exports.reportOperationalFailure('/profile/private-account?token=private');
  assert.deepEqual(calls,[{name:'report_operational_issue',args:{route_key:'profile'}}]);
  assert.equal(exports.operationalRoute('/clipts'),'feed');
  assert.equal(exports.operationalRoute('/messages/private-conversation'),'messages');
  assert.equal(exports.operationalRoute('/unrecognized/private-value'),'other');
});

test('operations notification routes to the existing staff dashboard',async()=>{
  const source=await readFile(new URL('../../src/lib/notification-link.ts',import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  const exports={};new Function('exports',compiled)(exports);
  assert.equal(exports.notificationLink('operational_alert',owner),'/moderation#operations-alerts');
  assert.equal(exports.notificationLink('operational_alert','untrusted'),null);
});

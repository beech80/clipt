-- Invite-only OBS beta. Service-only commands; no provider keys in public tables.
begin;
create table if not exists clipt_private.obs_beta_config(
 singleton boolean primary key default true check(singleton),
 enabled boolean not null default false,
 monthly_minutes integer not null default 300 check(monthly_minutes between 30 and 300),
 session_seconds integer not null default 1800 check(session_seconds between 60 and 1800),
 worker_at timestamptz,
 signing_id text, signing_secret uuid, webhook_id text, webhook_secret uuid,
 bootstrap_state text not null default 'new' check(bootstrap_state in ('new','claimed','ready','review')),
 bootstrap_at timestamptz
);
insert into clipt_private.obs_beta_config(singleton) values(true) on conflict do nothing;
create table if not exists clipt_private.obs_beta_usage(
 month date primary key, reserved_minutes integer not null default 0 check(reserved_minutes>=0)
);
create table if not exists clipt_private.obs_beta_sessions(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid references auth.users(id) on delete set null,
 stream_id uuid, auth_session_id uuid, auth_aal text,
 request_id uuid not null,
 provider_id text unique check(provider_id ~ '^[A-Za-z0-9]{1,200}$'),
 playback_id text check(playback_id ~ '^[A-Za-z0-9]{1,200}$'),
 state text not null check(state in ('provisioning','uncertain','ready','active','stopping','ended')),
 expires_at timestamptz not null, observed_at timestamptz,
 created_at timestamptz not null default clock_timestamp(), ended_at timestamptz,
 unique(owner_id,request_id)
);
create index if not exists obs_beta_cleanup on clipt_private.obs_beta_sessions(state,expires_at);
create table if not exists clipt_private.obs_beta_viewers(
 session_id uuid not null references clipt_private.obs_beta_sessions(id) on delete cascade,
 auth_session_id uuid not null, expires_at timestamptz not null,
 primary key(session_id,auth_session_id)
);
alter table clipt_private.obs_beta_config enable row level security;
alter table clipt_private.obs_beta_usage enable row level security;
alter table clipt_private.obs_beta_sessions enable row level security;
alter table clipt_private.obs_beta_viewers enable row level security;
revoke all on clipt_private.obs_beta_config,clipt_private.obs_beta_usage,clipt_private.obs_beta_sessions,clipt_private.obs_beta_viewers from public,anon,authenticated;

create or replace function clipt_private.obs_beta_account(u uuid,a uuid,aal text)
returns boolean language sql stable security definer set search_path='' as $$
select u is not null and a is not null and aal is not null and aal in ('aal1','aal2')
 and exists(select 1 from auth.users x join public.profiles p on p.id=x.id where x.id=u
  and x.email_confirmed_at is not null and not coalesce(x.is_anonymous,false)
  and x.deleted_at is null and (x.banned_until is null or x.banned_until<=statement_timestamp()))
 and exists(select 1 from auth.sessions s where s.id=a and s.user_id=u and (s.not_after is null or s.not_after>statement_timestamp()))
 and exists(select 1 from clipt_private.beta_members m where m.user_id=u and m.revoked_at is null
  and (m.expires_at is null or m.expires_at>statement_timestamp()))
 and not exists(select 1 from clipt_private.erasure_jobs e where e.user_id=u and e.state='cleanup')
 and (aal='aal2' or not exists(select 1 from auth.mfa_factors f where f.user_id=u and f.status='verified'));
$$;

create or replace function clipt_private.obs_beta_json(s clipt_private.obs_beta_sessions,claimed boolean default false)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('sessionId',s.id,'streamId',s.stream_id,'state',s.state,
 'providerId',s.provider_id,'playbackId',s.playback_id,'expiresAt',s.expires_at,
 'maxDurationSeconds',1800,'needsProvision',claimed);
$$;

create or replace function clipt_private.obs_beta_expire()
returns integer language plpgsql security definer set search_path='' as $$
declare s clipt_private.obs_beta_sessions%rowtype; n integer:=0;
begin
 for s in select * from clipt_private.obs_beta_sessions where state not in ('stopping','ended') for update skip locked loop
  if s.expires_at<=clock_timestamp()
   or not clipt_private.obs_beta_account(s.owner_id,s.auth_session_id,s.auth_aal)
   or not exists(select 1 from public.streams where id=s.stream_id and user_id=s.owner_id)
   or not coalesce((select enabled from clipt_private.obs_beta_config where singleton),false)
   or (s.state in ('provisioning','uncertain') and s.created_at<clock_timestamp()-interval '2 minutes') then
   update clipt_private.obs_beta_sessions set state='stopping' where id=s.id;
   update public.streams set is_live=false where id=s.stream_id; n:=n+1;
  end if;
 end loop;
 return n;
end;
$$;

create or replace function clipt_private.obs_beta_stream_delete()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 update clipt_private.obs_beta_sessions set state='stopping',stream_id=null
 where stream_id=old.id and state<>'ended';
 return old;
end;
$$;
drop trigger if exists clipt_obs_stop_deleted_stream on public.streams;
create trigger clipt_obs_stop_deleted_stream before delete on public.streams
for each row execute function clipt_private.obs_beta_stream_delete();

create or replace function clipt_private.obs_beta_admin(p_action text,p_args jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s clipt_private.obs_beta_sessions%rowtype; c clipt_private.obs_beta_config%rowtype;
 u uuid; a uuid; sid uuid; rid uuid; existed boolean; mon date; mins integer; n integer;
 secret_id uuid; k text; w text; observed timestamptz; live boolean;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'OBS service authorization required' using errcode='42501'; end if;
 if jsonb_typeof(p_args) is distinct from 'object' then raise exception 'Invalid command' using errcode='22023'; end if;
 select * into c from clipt_private.obs_beta_config where singleton;
 if p_action='configuration' then
  select decrypted_secret into k from vault.decrypted_secrets where id=c.signing_secret;
  select decrypted_secret into w from vault.decrypted_secrets where id=c.webhook_secret;
  return jsonb_build_object('enabled',c.enabled,'monthlyMinutes',c.monthly_minutes,'sessionSeconds',c.session_seconds,
   'workerAt',c.worker_at,'signingId',c.signing_id,'privateKey',k,'webhookId',c.webhook_id,'webhookSecret',w,
   'bootstrapState',c.bootstrap_state);
 end if;
 if p_action='bootstrap_claim' then
  update clipt_private.obs_beta_config set bootstrap_state='claimed',bootstrap_at=clock_timestamp()
   where singleton and bootstrap_state='new';
  return jsonb_build_object('claimed',found);
 end if;
 if p_action='bootstrap_save' then
  select * into c from clipt_private.obs_beta_config where singleton for update;
  if c.bootstrap_state<>'claimed' or c.bootstrap_at<clock_timestamp()-interval '2 minutes'
   or nullif(p_args->>'signingId','') is null or length(p_args->>'privateKey') not between 500 and 16384
   or length(p_args->>'webhookSecret') not between 16 and 500 then
   raise exception 'OBS configuration requires review' using errcode='42501'; end if;
  secret_id:=vault.create_secret(p_args->>'privateKey','clipt-obs-signing-key');
  update clipt_private.obs_beta_config set signing_secret=secret_id where singleton;
  secret_id:=vault.create_secret(p_args->>'webhookSecret','clipt-obs-webhook-secret');
  update clipt_private.obs_beta_config set signing_id=p_args->>'signingId',webhook_id=p_args->>'webhookId',
   webhook_secret=secret_id,bootstrap_state='ready' where singleton;
  return jsonb_build_object('saved',true);
 end if;
 if p_action='worker_complete' then
  update clipt_private.obs_beta_config set worker_at=clock_timestamp() where singleton;
  delete from clipt_private.obs_beta_viewers where expires_at<clock_timestamp();
  -- Erasure-safe provider tombstones retain no account/session identity after shutdown.
  update clipt_private.obs_beta_sessions set owner_id=null,auth_session_id=null,auth_aal=null,stream_id=null
   where state='ended' and ended_at<clock_timestamp()-interval '24 hours';
  return jsonb_build_object('ok',true);
 end if;
 if p_action='list' then
  perform clipt_private.obs_beta_expire();
  return coalesce((select jsonb_agg(clipt_private.obs_beta_json(t)) from
   (select * from clipt_private.obs_beta_sessions where state<>'ended' order by created_at limit 20) t),'[]'::jsonb);
 end if;
 if p_action='lookup' then
  select * into s from clipt_private.obs_beta_sessions where provider_id=p_args->>'providerId';
  return case when found then clipt_private.obs_beta_json(s) else null end;
 end if;
 if p_action='reserve' then
  perform pg_advisory_xact_lock(42126,1);
  u:=(p_args->>'ownerId')::uuid; a:=(p_args->>'authSessionId')::uuid;
  sid:=(p_args->>'streamId')::uuid; rid:=(p_args->>'requestId')::uuid;
  if not clipt_private.obs_beta_account(u,a,p_args->>'aal') then raise exception 'Invitation required' using errcode='42501'; end if;
  if not c.enabled or c.bootstrap_state<>'ready' or c.worker_at is null or c.worker_at<clock_timestamp()-interval '10 minutes'
   then raise exception 'OBS setup or independent cleanup unavailable' using errcode='55000'; end if;
  select * into s from clipt_private.obs_beta_sessions where owner_id=u and request_id=rid for update;
  existed:=found;
  perform 1 from public.streams where id=sid and user_id=u for update;
  if not found then raise exception 'Owned broadcast required' using errcode='42501'; end if;
  if existed then
   if s.stream_id is distinct from sid then raise exception 'Request identity conflict' using errcode='22023'; end if;
   return clipt_private.obs_beta_json(s,false);
  end if;
  if exists(select 1 from clipt_private.obs_beta_sessions where state<>'ended')
   or exists(select 1 from public.streams where is_live=true)
   or (select count(*) from clipt_private.obs_beta_sessions where owner_id=u and created_at>clock_timestamp()-interval '24 hours')>=2
   then raise exception 'Broadcast capacity reached' using errcode='P0001'; end if;
  mon:=date_trunc('month',clock_timestamp() at time zone 'UTC')::date;
  mins:=ceil(c.session_seconds/60.0);
  insert into clipt_private.obs_beta_usage(month) values(mon) on conflict do nothing;
  update clipt_private.obs_beta_usage set reserved_minutes=reserved_minutes+mins
   where month=mon and reserved_minutes+mins<=c.monthly_minutes;
  if not found then raise exception 'Monthly beta broadcast allowance reached' using errcode='P0001'; end if;
  insert into clipt_private.obs_beta_sessions(owner_id,stream_id,auth_session_id,auth_aal,request_id,state,expires_at)
   values(u,sid,a,p_args->>'aal',rid,'provisioning',clock_timestamp()+make_interval(secs=>c.session_seconds)) returning * into s;
  return clipt_private.obs_beta_json(s,true);
 end if;
 if p_action='current' then
  u:=(p_args->>'ownerId')::uuid; a:=(p_args->>'authSessionId')::uuid;
  if not clipt_private.obs_beta_account(u,a,p_args->>'aal') then raise exception 'Invitation required' using errcode='42501'; end if;
  select * into s from clipt_private.obs_beta_sessions where owner_id=u and state<>'ended' order by created_at desc limit 1;
  return case when found then clipt_private.obs_beta_json(s) else null end;
 end if;
 if p_action='viewer_candidate' then
  u:=(p_args->>'ownerId')::uuid; a:=(p_args->>'authSessionId')::uuid;
  if not clipt_private.obs_beta_account(u,a,p_args->>'aal') then raise exception 'Invitation required' using errcode='42501'; end if;
  select * into s from clipt_private.obs_beta_sessions where stream_id=(p_args->>'streamId')::uuid and state in ('ready','active');
  if not found then raise exception 'Broadcast unavailable' using errcode='42501'; end if;
  return clipt_private.obs_beta_json(s);
 end if;
 if p_action='playback' then
  u:=(p_args->>'ownerId')::uuid; a:=(p_args->>'authSessionId')::uuid;
  select * into s from clipt_private.obs_beta_sessions where stream_id=(p_args->>'streamId')::uuid and state='active' for update;
  if not found or s.expires_at<=clock_timestamp() or not c.enabled
   or not clipt_private.obs_beta_account(u,a,p_args->>'aal')
   or not clipt_private.obs_beta_account(s.owner_id,s.auth_session_id,s.auth_aal)
   or s.observed_at is null or s.observed_at<clock_timestamp()-interval '90 seconds'
   or exists(select 1 from public.user_blocks b where (b.blocker_id=u and b.blocked_id=s.owner_id) or (b.blocked_id=u and b.blocker_id=s.owner_id))
   then raise exception 'Private broadcast unavailable' using errcode='42501'; end if;
  delete from clipt_private.obs_beta_viewers where session_id=s.id and expires_at<clock_timestamp();
  if not exists(select 1 from clipt_private.obs_beta_viewers where session_id=s.id and auth_session_id=a)
   and (select count(*) from clipt_private.obs_beta_viewers where session_id=s.id)>=5 then
   raise exception 'Beta viewer capacity reached' using errcode='P0001'; end if;
  insert into clipt_private.obs_beta_viewers values(s.id,a,least(clock_timestamp()+interval '3 minutes',s.expires_at))
   on conflict(session_id,auth_session_id) do update set expires_at=excluded.expires_at;
  return clipt_private.obs_beta_json(s) || jsonb_build_object('tokenExpiresAt',
   (select expires_at from clipt_private.obs_beta_viewers where session_id=s.id and auth_session_id=a));
 end if;
 select * into s from clipt_private.obs_beta_sessions where id=(p_args->>'sessionId')::uuid for update;
 if not found then raise exception 'OBS session unavailable' using errcode='42501'; end if;
 if p_action in ('status','stop','credentials') then
  u:=(p_args->>'ownerId')::uuid; a:=(p_args->>'authSessionId')::uuid;
  if s.owner_id is distinct from u or not exists(select 1 from auth.sessions x where x.id=a and x.user_id=u and (x.not_after is null or x.not_after>statement_timestamp()))
   then raise exception 'Owned session required' using errcode='42501'; end if;
  if p_action='stop' then
   if s.state='ended' then return clipt_private.obs_beta_json(s); end if;
   update clipt_private.obs_beta_sessions set state='stopping' where id=s.id and state<>'ended' returning * into s;
   update public.streams set is_live=false where id=s.stream_id;
   return clipt_private.obs_beta_json(s);
  end if;
  if not c.enabled or not clipt_private.obs_beta_account(u,a,p_args->>'aal') or s.expires_at<=clock_timestamp()
   or s.state not in ('ready','active') then raise exception 'Broadcast expired or unavailable' using errcode='42501'; end if;
  return clipt_private.obs_beta_json(s);
 end if;
 if p_action='attach' then
  if s.state<>'provisioning' or s.expires_at<=clock_timestamp()
   or coalesce(p_args->>'providerId','') !~ '^[A-Za-z0-9]{1,200}$' or coalesce(p_args->>'playbackId','') !~ '^[A-Za-z0-9]{1,200}$'
   or not clipt_private.obs_beta_account(s.owner_id,s.auth_session_id,s.auth_aal)
   then raise exception 'Provision unavailable' using errcode='42501'; end if;
  update clipt_private.obs_beta_sessions set state='ready',provider_id=p_args->>'providerId',playback_id=p_args->>'playbackId'
   where id=s.id returning * into s;
 elsif p_action='uncertain' then
  update clipt_private.obs_beta_sessions set state=case when state='stopping' then state else 'uncertain' end,
   provider_id=coalesce(provider_id,p_args->>'providerId') where id=s.id and state<>'ended' returning * into s;
 elsif p_action='adopt' then
  if s.state not in ('provisioning','uncertain','stopping') then raise exception 'Adoption rejected' using errcode='42501'; end if;
  update clipt_private.obs_beta_sessions set provider_id=p_args->>'providerId',playback_id=p_args->>'playbackId',state='stopping'
   where id=s.id returning * into s;
 elsif p_action='stop_internal' then
  update clipt_private.obs_beta_sessions set state='stopping' where id=s.id and state<>'ended' returning * into s;
  update public.streams set is_live=false where id=s.stream_id;
 elsif p_action='finish' then
  if s.state<>'stopping' or (s.provider_id is not null and s.provider_id is distinct from p_args->>'providerId')
   then raise exception 'Provider stop unconfirmed' using errcode='42501'; end if;
  update clipt_private.obs_beta_sessions set state='ended',ended_at=clock_timestamp() where id=s.id returning * into s;
  update public.streams set is_live=false,ended_at=clock_timestamp(),playback_url=null,hls_playback_url=null where id=s.stream_id;
 elsif p_action='snapshot' then
  observed:=(p_args->>'observedAt')::timestamptz;
  if s.provider_id is null or s.provider_id is distinct from p_args->>'providerId' or s.playback_id is distinct from p_args->>'playbackId'
   or coalesce(p_args->>'status','') not in ('active','idle','disabled') or observed is null
   or observed<clock_timestamp()-interval '30 seconds' or observed>clock_timestamp()+interval '5 seconds'
   then raise exception 'Provider observation rejected' using errcode='22023'; end if;
  if s.observed_at is not null and s.observed_at>=observed then return clipt_private.obs_beta_json(s); end if;
  live:=c.enabled and s.state in ('ready','active') and s.expires_at>clock_timestamp()
   and clipt_private.obs_beta_account(s.owner_id,s.auth_session_id,s.auth_aal)
   and exists(select 1 from public.streams where id=s.stream_id and user_id=s.owner_id);
  update clipt_private.obs_beta_sessions set observed_at=observed,
   state=case when state='ended' then 'ended' when not live or p_args->>'status'='disabled' then 'stopping'
    when p_args->>'status'='active' then 'active' else 'ready' end where id=s.id returning * into s;
  update public.streams set is_live=(live and p_args->>'status'='active'),
   started_at=case when live and p_args->>'status'='active' then coalesce(started_at,clock_timestamp()) else started_at end,
   viewer_count=null,playback_url='clipt-obs:'||id::text,hls_playback_url='clipt-obs:'||id::text where id=s.stream_id;
 else raise exception 'Invalid OBS action' using errcode='22023'; end if;
 return clipt_private.obs_beta_json(s);
end;
$$;
create or replace function public.obs_beta_admin(p_action text,p_args jsonb default '{}'::jsonb)
returns jsonb language sql security invoker set search_path='' as $$
 select clipt_private.obs_beta_admin(p_action,p_args);
$$;
revoke all on function clipt_private.obs_beta_account(uuid,uuid,text),
 clipt_private.obs_beta_json(clipt_private.obs_beta_sessions,boolean),clipt_private.obs_beta_expire(),
 clipt_private.obs_beta_stream_delete(),clipt_private.obs_beta_admin(text,jsonb),public.obs_beta_admin(text,jsonb) from public,anon,authenticated;
grant execute on function clipt_private.obs_beta_admin(text,jsonb),public.obs_beta_admin(text,jsonb),clipt_private.obs_beta_expire() to service_role;
commit;

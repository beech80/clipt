-- Staged native-broadcast lifecycle. This file is NOT applied by a frontend build.
-- Requires existing invite/MFA/erasure and verified_live_chat installation.
-- All credential material remains at Mux/native edge; only SHA-256 hashes are stored.
begin;
create schema if not exists clipt_private;
revoke all on schema clipt_private from public, anon;
grant usage on schema clipt_private to service_role;

create table if not exists clipt_private.native_broadcast_sessions (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid references auth.users(id) on delete set null,
 stream_id uuid references public.streams(id) on delete set null,
 auth_session_id uuid not null,
 auth_aal text not null check(auth_aal in ('aal1','aal2')),
 request_id uuid not null,
 selection jsonb not null,
 provider_mode text not null check(provider_mode in ('test','paid')),
 max_duration_seconds integer not null check(max_duration_seconds between 60 and 7200),
 provider_id text unique check(provider_id ~ '^[A-Za-z0-9]{1,200}$'),
 playback_id text check(playback_id ~ '^[A-Za-z0-9]{1,200}$'),
 state text not null check(state in ('provisioning','uncertain','ready','starting','active','stopping','ended','failed')),
 provider_status text check(provider_status in ('active','idle','disabled')),
 grant_hash text unique check(grant_hash ~ '^[0-9a-f]{64}$'),
 grant_expires_at timestamptz,
 stop_hash text check(stop_hash ~ '^[0-9a-f]{64}$'),
 expires_at timestamptz not null,
 heartbeat_at timestamptz,
 observed_at timestamptz,
 created_at timestamptz not null default clock_timestamp(),
 ended_at timestamptz,
 stop_reason text check(stop_reason in ('owner','expired','heartbeat','account','provider','provision')),
 unique(owner_id, request_id),
 check(provider_mode<>'test' or max_duration_seconds<=300)
);
create unique index if not exists clipt_one_native_publisher
 on clipt_private.native_broadcast_sessions(owner_id)
 where state not in ('ended','failed');
create index if not exists clipt_native_cleanup_lookup
 on clipt_private.native_broadcast_sessions(state,expires_at);
create table if not exists clipt_private.native_live_receipts (
 event_id text primary key check(event_id ~ '^[A-Za-z0-9_-]{1,200}$'),
 session_id uuid not null references clipt_private.native_broadcast_sessions(id) on delete cascade,
 received_at timestamptz not null default clock_timestamp()
);
alter table clipt_private.native_broadcast_sessions enable row level security;
alter table clipt_private.native_live_receipts enable row level security;
revoke all on clipt_private.native_broadcast_sessions, clipt_private.native_live_receipts from public,anon,authenticated;

create or replace function clipt_private.native_owner_available(p_owner uuid,p_auth_session uuid,p_aal text)
returns boolean language sql stable security definer set search_path='' as $$
 select p_owner is not null
 and exists(select 1 from auth.users u join public.profiles p on p.id=u.id
  where u.id=p_owner and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
  and u.deleted_at is null and (u.banned_until is null or u.banned_until<=statement_timestamp()))
 and exists(select 1 from auth.sessions s where s.id=p_auth_session and s.user_id=p_owner
  and (s.not_after is null or s.not_after>statement_timestamp()))
 and coalesce((select not c.enabled or exists(select 1 from clipt_private.beta_members m
  where m.user_id=p_owner and m.revoked_at is null
  and (m.expires_at is null or m.expires_at>statement_timestamp()))
  from clipt_private.beta_access_config c where c.singleton),false)
 and not exists(select 1 from clipt_private.erasure_jobs e where e.user_id=p_owner and e.state='cleanup')
 and (p_aal='aal2' or not exists(select 1 from auth.mfa_factors f where f.user_id=p_owner and f.status='verified'));
$$;
revoke all on function clipt_private.native_owner_available(uuid,uuid,text) from public,anon,authenticated;
create or replace function clipt_private.native_session_json(s clipt_private.native_broadcast_sessions,p_claim boolean default false)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('sessionId',s.id,'streamId',s.stream_id,'ownerId',s.owner_id,'state',s.state,
  'selection',s.selection,'providerMode',s.provider_mode,'providerId',s.provider_id,'playbackId',s.playback_id,
  'maxDurationSeconds',s.max_duration_seconds,'expiresAt',s.expires_at,'grantExpiresAt',s.grant_expires_at,
  'needsProvision',p_claim,'providerStatus',s.provider_status);
$$;
revoke all on function clipt_private.native_session_json(clipt_private.native_broadcast_sessions,boolean) from public,anon,authenticated;

-- No HTTP or secret headers in pg_net. This SQL-only expiry can be scheduled by
-- pg_cron independently of the WebView. External reconciliation disables Mux.
create or replace function clipt_private.expire_native_broadcast_sessions()
returns integer language plpgsql security definer set search_path='' as $$
declare s clipt_private.native_broadcast_sessions%rowtype; n integer:=0; reason text;
begin
 for s in select * from clipt_private.native_broadcast_sessions
  where state not in ('ended','failed','stopping') for update skip locked loop
  reason:=null;
  if not clipt_private.native_owner_available(s.owner_id,s.auth_session_id,s.auth_aal) then reason:='account';
  elsif s.expires_at<=clock_timestamp() or (s.state='ready' and s.grant_expires_at<=clock_timestamp())
    then reason:='expired';
  elsif s.state in ('starting','active') and s.heartbeat_at<clock_timestamp()-interval '90 seconds'
    then reason:='heartbeat';
  elsif s.state in ('provisioning','uncertain') and s.created_at<clock_timestamp()-interval '60 seconds'
    then reason:='provision'; end if;
  if reason is not null then
   update clipt_private.native_broadcast_sessions set state='stopping',stop_reason=reason,grant_hash=null where id=s.id;
   update public.streams set is_live=false where id=s.stream_id;
   update clipt_private.live_provider_state set verified_until=least(verified_until,clock_timestamp()) where stream_id=s.stream_id;
   n:=n+1;
  end if;
 end loop;
 return n;
end;
$$;
revoke all on function clipt_private.expire_native_broadcast_sessions() from public,anon,authenticated;
grant execute on function clipt_private.expire_native_broadcast_sessions() to service_role;

create or replace function clipt_private.native_broadcast_admin(p_action text,p_args jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 s clipt_private.native_broadcast_sessions%rowtype; owner uuid; sid uuid; aid uuid; rid uuid; sel jsonb;
 mode text; max_seconds integer; granted text; alive boolean; existed boolean; id_hash text; event_id text;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Native service authorization required' using errcode='42501'; end if;
 if p_args is null or jsonb_typeof(p_args)<>'object' then raise exception 'Invalid native operation' using errcode='22023'; end if;

 if p_action='reserve' then
  owner:=(p_args->>'ownerId')::uuid; aid:=(p_args->>'authSessionId')::uuid;
  sid:=(p_args->>'streamId')::uuid; rid:=(p_args->>'requestId')::uuid; sel:=p_args->'selection';
  mode:=p_args->>'providerMode'; max_seconds:=(p_args->>'maxDurationSeconds')::integer; granted:=p_args->>'grantHash';
  if not clipt_private.native_owner_available(owner,aid,p_args->>'aal') then
   raise exception 'Native account unavailable' using errcode='42501'; end if;
  if sel is null or jsonb_typeof(sel)<>'object' or (select count(*) from jsonb_object_keys(sel))<>6
   or coalesce(sel->>'mode','') not in ('camera','screen')
   or coalesce(sel->>'quality','') not in ('360p15','480p30','720p30','1080p30')
   or coalesce(sel->>'orientation','') not in ('portrait','landscape')
   or coalesce(sel->>'cameraPosition','') not in ('front','back')
   or jsonb_typeof(sel->'microphone') is distinct from 'boolean'
   or jsonb_typeof(sel->'systemAudio') is distinct from 'boolean'
   or (sel->>'systemAudio'='true' and sel->>'mode'<>'screen')
   or mode is null or mode not in ('test','paid') or max_seconds is null
   or max_seconds not between 60 and (case when mode='test' then 300 else 7200 end)
   or granted is null or granted !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid native configuration' using errcode='22023'; end if;
  -- Account lock closes concurrent requests across different stream rows.
  perform pg_advisory_xact_lock(42125,1);
  perform pg_advisory_xact_lock(hashtextextended(owner::text,42125));
  -- Match snapshot/expiry lock order: session first, then its public stream.
  -- Otherwise an idempotent reserve can deadlock with a provider observation.
  select * into s from clipt_private.native_broadcast_sessions where owner_id=owner and request_id=rid for update;
  existed:=found;
  perform 1 from public.streams where id=sid and user_id=owner for update;
  if not found then raise exception 'Owned stream unavailable' using errcode='42501'; end if;
  if existed then
   if s.stream_id is distinct from sid or s.selection is distinct from sel or s.provider_mode is distinct from mode then
    raise exception 'Idempotency conflict' using errcode='22023'; end if;
   if s.state='ready' and s.expires_at>clock_timestamp() then
    update clipt_private.native_broadcast_sessions set grant_hash=granted,
      grant_expires_at=least(clock_timestamp()+interval '60 seconds',expires_at)
      where id=s.id returning * into s;
   end if;
   return clipt_private.native_session_json(s,false);
  end if;
  if exists(select 1 from public.streams where user_id=owner and is_live=true) or
   exists(select 1 from clipt_private.native_broadcast_sessions where owner_id=owner and state not in ('ended','failed')) then
   raise exception 'A broadcast session already exists' using errcode='P0001'; end if;
  if (select count(*) from clipt_private.native_broadcast_sessions where state not in ('ended','failed'))>=12
   or (select count(*) from clipt_private.native_broadcast_sessions where owner_id=owner and created_at>clock_timestamp()-interval '24 hours')>=12
   or (select count(*) from clipt_private.native_broadcast_sessions where created_at>clock_timestamp()-interval '24 hours')>=200 then
   raise exception 'Native creation limit reached' using errcode='P0001'; end if;
  insert into clipt_private.native_broadcast_sessions(owner_id,stream_id,auth_session_id,auth_aal,request_id,selection,
   provider_mode,max_duration_seconds,state,grant_hash,grant_expires_at,expires_at)
  values(owner,sid,aid,p_args->>'aal',rid,sel,mode,max_seconds,'provisioning',granted,
   clock_timestamp()+interval '60 seconds',clock_timestamp()+interval '2 minutes')
  returning * into s;
  return clipt_private.native_session_json(s,true);
 end if;

 if p_action='redeem' then
  granted:=p_args->>'grantHash'; id_hash:=p_args->>'stopHash';
  if granted is null or granted !~ '^[0-9a-f]{64}$' or id_hash is null or id_hash !~ '^[0-9a-f]{64}$' then
   raise exception 'Invalid broadcast grant' using errcode='42501'; end if;
  select * into s from clipt_private.native_broadcast_sessions where grant_hash=granted for update;
  if not found or s.state<>'ready' or s.grant_expires_at<=clock_timestamp()
   or s.expires_at<=clock_timestamp() or s.provider_id is null
   or not clipt_private.native_owner_available(s.owner_id,s.auth_session_id,s.auth_aal) then
   raise exception 'Invalid broadcast grant' using errcode='42501'; end if;
  update clipt_private.native_broadcast_sessions set grant_hash=null,grant_expires_at=null,
   stop_hash=id_hash,state='starting',heartbeat_at=clock_timestamp(),
   expires_at=clock_timestamp()+make_interval(secs=>s.max_duration_seconds)
   where id=s.id returning * into s;
  return clipt_private.native_session_json(s);
 end if;

 if p_action='lookup_provider' then
  select * into s from clipt_private.native_broadcast_sessions where provider_id=p_args->>'providerId';
  if not found then return null; end if; return clipt_private.native_session_json(s);
 end if;
 if p_action='reconcile_list' then
  perform clipt_private.expire_native_broadcast_sessions();
  return coalesce((select jsonb_agg(clipt_private.native_session_json(t)) from
   (select * from clipt_private.native_broadcast_sessions where state not in ('ended','failed')
    order by case when state in ('stopping','uncertain','provisioning') then 0 else 1 end,created_at limit 100) t),'[]'::jsonb);
 end if;
 if p_action='current' then
  owner:=(p_args->>'ownerId')::uuid; aid:=(p_args->>'authSessionId')::uuid;
  if not exists(select 1 from auth.sessions a where a.id=aid and a.user_id=owner
   and (a.not_after is null or a.not_after>statement_timestamp())) then
   raise exception 'Native owner required' using errcode='42501'; end if;
  perform clipt_private.expire_native_broadcast_sessions();
  select * into s from clipt_private.native_broadcast_sessions where owner_id=owner
   and state not in ('ended','failed') order by created_at desc limit 1;
  if not found then return null; end if; return clipt_private.native_session_json(s);
 end if;
 if p_action='playback' then
  select * into s from clipt_private.native_broadcast_sessions where stream_id=(p_args->>'streamId')::uuid
    and state='active' order by created_at desc limit 1 for update;
  if not found then raise exception 'Native stream offline' using errcode='P0001'; end if;
  owner:=(p_args->>'viewerId')::uuid; aid:=(p_args->>'authSessionId')::uuid;
  if (s.provider_mode='test' and owner is distinct from s.owner_id and not exists(select 1 from clipt_private.beta_members m
    where m.user_id=owner and m.revoked_at is null and (m.expires_at is null or m.expires_at>statement_timestamp())))
   or not clipt_private.native_owner_available(owner,aid,p_args->>'aal')
   or not clipt_private.native_owner_available(s.owner_id,s.auth_session_id,s.auth_aal)
   or s.expires_at<=clock_timestamp()
   or exists(select 1 from public.user_blocks b where (b.blocker_id=owner and b.blocked_id=s.owner_id)
    or (b.blocked_id=owner and b.blocker_id=s.owner_id)) then
   raise exception 'Native viewer unavailable' using errcode='42501'; end if;
  return clipt_private.native_session_json(s);
 end if;

 select * into s from clipt_private.native_broadcast_sessions where id=(p_args->>'sessionId')::uuid for update;
 if not found then raise exception 'Native session unavailable' using errcode='42501'; end if;
 if p_action in ('status','stop') then
  if p_args ? 'stopHash' then
   if s.stop_hash is null or s.stop_hash is distinct from p_args->>'stopHash' then
    raise exception 'Invalid session token' using errcode='42501'; end if;
  else
   owner:=(p_args->>'ownerId')::uuid; aid:=(p_args->>'authSessionId')::uuid;
   if s.owner_id is distinct from owner or not exists(select 1 from auth.sessions a
    where a.id=aid and a.user_id=owner and (a.not_after is null or a.not_after>statement_timestamp())) then
    raise exception 'Native owner required' using errcode='42501'; end if;
  end if;
  if p_action='status' then return clipt_private.native_session_json(s); end if;
  if s.state not in ('ended','failed') then
   update clipt_private.native_broadcast_sessions set state='stopping',stop_reason='owner',grant_hash=null
    where id=s.id returning * into s;
   update public.streams set is_live=false where id=s.stream_id;
   update clipt_private.live_provider_state set verified_until=least(verified_until,clock_timestamp()) where stream_id=s.stream_id;
  end if;
  return clipt_private.native_session_json(s);
 end if;

 if p_action='heartbeat' then
  if s.stop_hash is null or s.stop_hash is distinct from p_args->>'stopHash'
   or s.state not in ('starting','active') or s.expires_at<=clock_timestamp()
   or not clipt_private.native_owner_available(s.owner_id,s.auth_session_id,s.auth_aal) then
    raise exception 'Native session is no longer authorized' using errcode='42501'; end if;
  -- Fixed maximum never slides forward from client heartbeats.
  update clipt_private.native_broadcast_sessions set heartbeat_at=clock_timestamp() where id=s.id returning * into s;
  return clipt_private.native_session_json(s);
 end if;
 if p_action='attach' then
  if s.state<>'provisioning' or p_args->>'providerId' is null or p_args->>'providerId' !~ '^[A-Za-z0-9]{1,200}$'
   or p_args->>'playbackId' is null or p_args->>'playbackId' !~ '^[A-Za-z0-9]{1,200}$'
   or not clipt_private.native_owner_available(s.owner_id,s.auth_session_id,s.auth_aal) then
    raise exception 'Native provision unavailable' using errcode='42501'; end if;
  update clipt_private.native_broadcast_sessions set state='ready',provider_id=p_args->>'providerId',
    playback_id=p_args->>'playbackId',provider_status='idle'
    where id=s.id returning * into s;
  return clipt_private.native_session_json(s);
 end if;
 if p_action='uncertain' then
  if s.state not in ('provisioning','uncertain','stopping') then return clipt_private.native_session_json(s); end if;
  update clipt_private.native_broadcast_sessions set state='uncertain',stop_reason='provision',
    provider_id=coalesce(provider_id,p_args->>'providerId'),grant_hash=null
    where id=s.id returning * into s;
  return clipt_private.native_session_json(s);
 end if;
 if p_action='adopt_cleanup' then
  if s.state not in ('provisioning','uncertain','stopping') or p_args->>'providerId' is null
   or p_args->>'providerId' !~ '^[A-Za-z0-9]{1,200}$' then
    raise exception 'Native cleanup unavailable' using errcode='42501'; end if;
  update clipt_private.native_broadcast_sessions set state='stopping',stop_reason='provision',
    provider_id=p_args->>'providerId',playback_id=p_args->>'playbackId',grant_hash=null
    where id=s.id returning * into s;
  return clipt_private.native_session_json(s);
 end if;
 if p_action='snapshot' then
  if s.provider_id is null or s.provider_id is distinct from p_args->>'providerId'
   or coalesce(p_args->>'status','') not in ('active','idle','disabled')
   or s.playback_id is distinct from p_args->>'playbackId'
   or p_args->>'observedAt' is null
   or (p_args->>'observedAt')::timestamptz > clock_timestamp()+interval '5 seconds'
   or (p_args->>'observedAt')::timestamptz < clock_timestamp()-interval '30 seconds' then
    raise exception 'Native snapshot invalid' using errcode='22023'; end if;
  if s.observed_at is not null and s.observed_at>=(p_args->>'observedAt')::timestamptz then
   return clipt_private.native_session_json(s); end if;
  event_id:=p_args->>'eventId';
  if event_id is not null then
   if event_id !~ '^[A-Za-z0-9_-]{1,200}$' then raise exception 'Invalid provider event' using errcode='22023'; end if;
   insert into clipt_private.native_live_receipts(event_id,session_id) values(event_id,s.id) on conflict do nothing;
   if not found then return clipt_private.native_session_json(s); end if;
  end if;
  alive:=s.state in ('starting','active') and s.expires_at>clock_timestamp()
   and s.heartbeat_at>clock_timestamp()-interval '90 seconds'
   and clipt_private.native_owner_available(s.owner_id,s.auth_session_id,s.auth_aal);
  if s.stream_id is not null and s.owner_id is not null then
   if alive then
    perform clipt_private.apply_live_provider_snapshot(s.stream_id,s.owner_id,s.provider_id,
      p_args->>'status','https://stream.mux.com/'||s.playback_id||'.m3u8',(p_args->>'observedAt')::timestamptz);
    -- Public rows signal authorized resolution; never publish a signed-policy ID as a playable URL.
    update public.streams set playback_url='clipt-native:'||s.stream_id::text, hls_playback_url=null where id=s.stream_id;
   else
    update public.streams set is_live=false where id=s.stream_id;
    update clipt_private.live_provider_state set verified_until=least(verified_until,clock_timestamp()) where stream_id=s.stream_id;
   end if;
  end if;
  update clipt_private.native_broadcast_sessions set
   provider_status=p_args->>'status', observed_at=(p_args->>'observedAt')::timestamptz,
   state=case when p_args->>'status'='disabled' then 'ended'
    when state in ('ended','failed','stopping','uncertain','provisioning') then state
    when alive and p_args->>'status'='active' then 'active'
    when state='ready' and p_args->>'status'='idle' then 'ready'
    when alive and p_args->>'status'='idle' then 'starting'
    else 'stopping' end,
   ended_at=case when p_args->>'status'='disabled' then coalesce(ended_at,clock_timestamp()) else ended_at end
   where id=s.id returning * into s;
  return clipt_private.native_session_json(s);
 end if;
 if p_action='finish_stop' then
  if s.provider_id is not null and (p_args->>'providerId' is distinct from s.provider_id
    or p_args->>'observedAt' is null
    or (p_args->>'observedAt')::timestamptz<clock_timestamp()-interval '30 seconds'
    or (p_args->>'observedAt')::timestamptz>clock_timestamp()+interval '5 seconds') then
   raise exception 'Native provider stop confirmation required' using errcode='42501'; end if;
  if s.state not in ('stopping','uncertain','provisioning','ended','failed') then
    raise exception 'Native stop must be requested first' using errcode='42501'; end if;
  update clipt_private.native_broadcast_sessions set state='ended',provider_status='disabled',grant_hash=null,
   ended_at=coalesce(ended_at,clock_timestamp()) where id=s.id returning * into s;
  update public.streams set is_live=false,ended_at=clock_timestamp() where id=s.stream_id;
  update clipt_private.live_provider_state set verified_until=least(verified_until,clock_timestamp()) where stream_id=s.stream_id;
  return clipt_private.native_session_json(s);
 end if;
 raise exception 'Invalid native operation' using errcode='22023';
end;
$$;
revoke all on function clipt_private.native_broadcast_admin(text,jsonb) from public,anon,authenticated;
grant execute on function clipt_private.native_broadcast_admin(text,jsonb) to service_role;
create or replace function public.native_broadcast_admin(p_action text,p_args jsonb)
returns jsonb language sql security invoker set search_path='' as $$
 select clipt_private.native_broadcast_admin(p_action,p_args);
$$;
revoke all on function public.native_broadcast_admin(text,jsonb) from public,anon,authenticated;
grant execute on function public.native_broadcast_admin(text,jsonb) to service_role;
commit;

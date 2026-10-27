begin;
create table public.content_reward_verifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
 post_id uuid references public.posts(id) on delete set null, original_post_id uuid not null unique,
 object_path text not null, sha256 text not null check(sha256 ~ '^[0-9a-f]{64}$'),
 byte_size integer not null check(byte_size between 32 and 52428800),
 duration_seconds double precision not null check(duration_seconds>0 and duration_seconds<=86400),
 awarded_tokens integer not null check(awarded_tokens between 0 and 3),
 verified_at timestamptz not null default clock_timestamp(),
 unique(user_id,sha256),unique(user_id,object_path)
);
alter table public.content_reward_verifications enable row level security;
revoke all on public.content_reward_verifications from public,anon,authenticated;
grant select on public.content_reward_verifications to authenticated;
grant all on public.content_reward_verifications to service_role;
create policy clipt_content_reward_owner on public.content_reward_verifications for select to authenticated
 using(user_id=(select auth.uid()));
create table clipt_private.content_reward_attempts(user_id uuid not null references auth.users(id) on delete cascade,attempted_at timestamptz not null default clock_timestamp());
alter table clipt_private.content_reward_attempts enable row level security;
revoke all on clipt_private.content_reward_attempts from public,anon,authenticated;
create index clipt_content_reward_rate on clipt_private.content_reward_attempts(user_id,attempted_at);

create function clipt_private.begin_content_reward_check(p_user_id uuid,p_post_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.posts where id=p_post_id and user_id=p_user_id) then
  raise exception 'Post unavailable' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended('clipt-reward-check:'||p_user_id::text,0));
 if (select count(*) from clipt_private.content_reward_attempts where user_id=p_user_id and attempted_at>clock_timestamp()-interval '1 minute')>=3 then
  return false; end if;
 insert into clipt_private.content_reward_attempts(user_id) values(p_user_id);return true;
end $$;
revoke all on function clipt_private.begin_content_reward_check(uuid,uuid) from public,anon,authenticated;
grant execute on function clipt_private.begin_content_reward_check(uuid,uuid) to service_role;
create function public.begin_content_reward_check(p_user_id uuid,p_post_id uuid) returns boolean
language sql security invoker set search_path='' as $$select clipt_private.begin_content_reward_check(p_user_id,p_post_id);$$;
revoke all on function public.begin_content_reward_check(uuid,uuid) from public,anon,authenticated;
grant execute on function public.begin_content_reward_check(uuid,uuid) to service_role;

create function clipt_private.reward_verified_clipt(p_user_id uuid,p_post_id uuid,p_object_path text,p_sha256 text,p_byte_size integer,p_duration_seconds double precision)
returns jsonb language plpgsql security definer set search_path='' as $$
declare target public.posts%rowtype; previous public.content_reward_verifications%rowtype;
 proof_id uuid:=gen_random_uuid(); balance_now bigint; daily integer; stored integer; earned bigint; amount integer; starts_at timestamptz;
begin
 if p_user_id is null or p_post_id is null or p_sha256 is null or p_sha256!~'^[0-9a-f]{64}$'
  or p_byte_size is null or p_byte_size not between 32 and 52428800
  or p_duration_seconds is null or not(p_duration_seconds>0 and p_duration_seconds<=86400) then
  raise exception 'Invalid media proof' using errcode='22023'; end if;
 select * into target from public.posts where id=p_post_id for share;
 if target.id is null or target.user_id<>p_user_id or target.is_published is not true or target.moderation_hidden
  or target.is_premium is true or target.is_subscriber_only is true or target.required_tier_id is not null
  or target.post_type not in ('clipt','clipts','video') or target.created_at>statement_timestamp()
  or target.video_url is null or right(target.video_url,length(p_object_path)) is distinct from p_object_path then
  raise exception 'Clipt is not eligible' using errcode='42501'; end if;
 if not exists(select 1 from storage.objects o where o.bucket_id='media' and o.name=p_object_path
   and coalesce(o.owner_id,o.owner::text)=p_user_id::text and split_part(o.name,'/',1)=p_user_id::text
   and o.metadata->>'mimetype'='video/mp4' and (o.metadata->>'size')::bigint=p_byte_size) then
  raise exception 'Owned media proof unavailable' using errcode='42501'; end if;
 insert into public.token_wallets(user_id) values(p_user_id) on conflict do nothing;
 select balance into balance_now from public.token_wallets where user_id=p_user_id for update;
 select * into previous from public.content_reward_verifications where original_post_id=p_post_id;
 if found then return jsonb_build_object('status','already_checked','awarded',previous.awarded_tokens,'balance',balance_now); end if;
 if exists(select 1 from public.content_reward_verifications where user_id=p_user_id and (sha256=p_sha256 or object_path=p_object_path)) then
  return jsonb_build_object('status','duplicate_content','awarded',0,'balance',balance_now); end if;
 select daily_cap,storage_cap into daily,stored from clipt_private.token_limits(p_user_id);
 starts_at:=date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC';
 select coalesce(sum(l.amount),0) into earned from public.token_ledger l
  where l.user_id=p_user_id and l.kind='REWARD' and l.created_at>=starts_at and l.created_at<starts_at+interval '1 day';
 amount:=greatest(0,least(3,daily-earned,stored-balance_now));
 insert into public.content_reward_verifications(id,user_id,post_id,original_post_id,object_path,sha256,byte_size,duration_seconds,awarded_tokens)
 values(proof_id,p_user_id,p_post_id,p_post_id,p_object_path,p_sha256,p_byte_size,p_duration_seconds,amount);
 if amount>0 then
  insert into public.token_ledger(user_id,amount,kind,idempotency_key,reference_id,metadata)
  values(p_user_id,amount,'REWARD','reward:post:'||p_post_id,proof_id::text,jsonb_build_object('action','post_clipt','post_id',p_post_id,'base_reward',3));
  update public.token_wallets set balance=balance+amount,updated_at=clock_timestamp() where user_id=p_user_id;
 end if;
 return jsonb_build_object('status',case when amount>0 then 'awarded' else 'limit_reached' end,'awarded',amount,'balance',balance_now+amount);
end $$;
revoke all on function clipt_private.reward_verified_clipt(uuid,uuid,text,text,integer,double precision) from public,anon,authenticated;
grant execute on function clipt_private.reward_verified_clipt(uuid,uuid,text,text,integer,double precision) to service_role;
create function public.reward_verified_clipt(p_user_id uuid,p_post_id uuid,p_object_path text,p_sha256 text,p_byte_size integer,p_duration_seconds double precision)
returns jsonb language sql security invoker set search_path='' as $$
 select clipt_private.reward_verified_clipt(p_user_id,p_post_id,p_object_path,p_sha256,p_byte_size,p_duration_seconds);
$$;
revoke all on function public.reward_verified_clipt(uuid,uuid,text,text,integer,double precision) from public,anon,authenticated;
grant execute on function public.reward_verified_clipt(uuid,uuid,text,text,integer,double precision) to service_role;
notify pgrst,'reload schema';
commit;

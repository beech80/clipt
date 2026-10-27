begin;
create table public.token_activity_claims (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),
 action text not null check(action in ('likes10','comments5')),
 source_key text not null,awarded_tokens integer not null check(awarded_tokens between 0 and 3),
 created_at timestamptz not null default clock_timestamp(),unique(user_id,action,source_key)
);
alter table public.token_activity_claims enable row level security;
revoke all on public.token_activity_claims from public,anon,authenticated;
grant select on public.token_activity_claims to authenticated;
grant all on public.token_activity_claims to service_role;
create policy clipt_activity_claim_owner on public.token_activity_claims for select to authenticated using(user_id=(select auth.uid()));

create function clipt_private.check_like_token_milestone(p_post_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare target public.posts%rowtype; available bigint; daily integer; stored integer;
 earned bigint; amount integer; start_day timestamptz; claim uuid:=gen_random_uuid();
begin
 select * into target from public.posts where id=p_post_id for share;
 if target.id is null or target.is_published is not true or target.moderation_hidden
  or target.is_premium is true or target.is_subscriber_only is true or target.required_tier_id is not null
  or target.post_type not in ('clipt','clipts','video') then return; end if;
 -- Only a server-checked, still-associated uploaded Clipt qualifies. No reward
 -- for a fabricated URL, missing proof, self-like or repeated user vote.
 if not exists(select 1 from public.content_reward_verifications v where v.post_id=target.id
   and v.user_id=target.user_id and right(target.video_url,length(v.object_path))=v.object_path) then return; end if;
 insert into public.token_wallets(user_id) values(target.user_id) on conflict do nothing;
 select balance into available from public.token_wallets where user_id=target.user_id for update;
 if exists(select 1 from public.token_activity_claims where user_id=target.user_id and action='likes10' and source_key=p_post_id::text) then return; end if;
 if (select count(distinct user_id) from public.likes where post_id=p_post_id and user_id<>target.user_id)<10 then return; end if;
 select daily_cap,storage_cap into daily,stored from clipt_private.token_limits(target.user_id);
 start_day:=date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC';
 select coalesce(sum(l.amount),0) into earned from public.token_ledger l where l.user_id=target.user_id
  and l.kind='REWARD' and l.created_at>=start_day and l.created_at<start_day+interval '1 day';
 amount:=greatest(0,least(3,daily-earned,stored-available));
 insert into public.token_activity_claims(id,user_id,action,source_key,awarded_tokens)
 values(claim,target.user_id,'likes10',p_post_id::text,amount);
 if amount>0 then
  insert into public.token_ledger(user_id,amount,kind,idempotency_key,reference_id,metadata)
  values(target.user_id,amount,'REWARD','reward:likes10:'||p_post_id,claim::text,
    jsonb_build_object('action','likes10','post_id',p_post_id,'base_reward',3));
  update public.token_wallets set balance=balance+amount,updated_at=clock_timestamp() where user_id=target.user_id;
 end if;
end $$;
revoke all on function clipt_private.check_like_token_milestone(uuid) from public,anon,authenticated,service_role;
create function clipt_private.like_token_milestone_trigger() returns trigger
language plpgsql security definer set search_path='' as $$
begin perform clipt_private.check_like_token_milestone(new.post_id);return new;end $$;
revoke all on function clipt_private.like_token_milestone_trigger() from public,anon,authenticated,service_role;
create trigger clipt_like_token_milestone after insert on public.likes for each row
 execute function clipt_private.like_token_milestone_trigger();
-- Run after the publication award has finished updating the wallet, so the
-- milestone observes its final caps rather than competing inside that write.
create constraint trigger clipt_verified_like_token_milestone after insert on public.content_reward_verifications
 deferrable initially deferred for each row
 execute function clipt_private.like_token_milestone_trigger();
notify pgrst,'reload schema';
commit;

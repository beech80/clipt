begin;
set local lock_timeout='5s';

-- Add an entitlement funding mode without rewriting balances or paid history.
alter table public.content_boosts
 add column funding_source text not null default 'tokens',
 add column entitlement_week date,
 alter column ledger_id drop not null,
 drop constraint content_boosts_token_cost_check,
 drop constraint content_boosts_check1;
alter table public.content_boosts add constraint clipt_boost_funding_contract check (
 (funding_source='tokens' and entitlement_week is null and ledger_id is not null
  and token_cost>0 and token_cost=base_price*(100-discount_percent)/100)
 or
 (funding_source='premium_weekly' and package_code='squad_blast' and token_cost=0
  and discount_percent=0 and ledger_id is null and entitlement_week is not null
  and extract(isodow from entitlement_week)=1
  and activated_at >= (entitlement_week::timestamp at time zone 'UTC')
  and activated_at < ((entitlement_week+7)::timestamp at time zone 'UTC'))
);
create unique index clipt_premium_weekly_once on public.content_boosts(user_id,entitlement_week)
 where funding_source='premium_weekly';

create function clipt_private.utc_boost_week(p_time timestamptz) returns date
 language sql immutable strict set search_path='' as $$
 select date_trunc('week',p_time at time zone 'UTC')::date;
$$;
revoke all on function clipt_private.utc_boost_week(timestamptz) from public,anon,authenticated;

create function clipt_private.weekly_squad_status() returns jsonb
 language plpgsql stable security definer set search_path='' as $$
declare economy jsonb; week_start date:=clipt_private.utc_boost_week(statement_timestamp()); used boolean;
begin
 economy:=clipt_private.boost_economy(); -- Existing Auth, MFA and server membership checks.
 select exists(select 1 from public.content_boosts where user_id=auth.uid()
  and funding_source='premium_weekly' and entitlement_week=week_start) into used;
 return jsonb_build_object('available',economy->>'membership'='premium' and not used,
  'used',used,'week_start',week_start,'resets_at',(week_start+7)::timestamp at time zone 'UTC',
  'package_code','squad_blast','token_cost',0,'rollover',false);
end $$;
revoke all on function clipt_private.weekly_squad_status() from public,anon;
grant execute on function clipt_private.weekly_squad_status() to authenticated;

create or replace function public.get_boost_economy() returns jsonb
 language sql stable security invoker set search_path='' as $$
 select clipt_private.boost_economy() || jsonb_build_object('weekly_squad_blast',clipt_private.weekly_squad_status());
$$;

create function clipt_private.redeem_weekly_squad_blast(p_post_id uuid,p_idempotency_key uuid,p_expected_week date)
 returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); target public.posts%rowtype; prior public.content_boosts%rowtype;
 package public.boost_packages%rowtype; activated timestamptz; week_start date;
 economy jsonb; result uuid:=gen_random_uuid();
begin
 if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
  or not clipt_private.account_available() then
  raise exception 'Authenticated account and enrolled MFA verification required' using errcode='42501'; end if;
 if p_post_id is null or p_idempotency_key is null or p_expected_week is null then
  raise exception 'Invalid weekly Boost request' using errcode='22023'; end if;
 -- Same lock order as paid activation and moderation: post, then actor wallet.
 select * into target from public.posts where id=p_post_id for update;
 insert into public.token_wallets(user_id) values(actor) on conflict do nothing;
 perform 1 from public.token_wallets where user_id=actor for update;
 select * into prior from public.content_boosts where user_id=actor and idempotency_key=p_idempotency_key;
 if found then
  if prior.original_post_id<>p_post_id or prior.funding_source<>'premium_weekly'
   or prior.entitlement_week<>p_expected_week then
   raise exception 'Idempotency conflict' using errcode='22023'; end if;
  return prior.id; -- A retry never reactivates expired/invalidated content.
 end if;
 economy:=clipt_private.boost_economy();
 if economy->>'membership'<>'premium' then
  raise exception 'Active Premium membership required' using errcode='42501'; end if;
 activated:=clock_timestamp();week_start:=clipt_private.utc_boost_week(activated);
 if p_expected_week<>week_start then
  raise exception 'Weekly entitlement changed; refresh and confirm again' using errcode='22023'; end if;
 if exists(select 1 from public.content_boosts where user_id=actor
  and funding_source='premium_weekly' and entitlement_week=week_start) then
  raise exception 'Weekly Squad Blast already redeemed' using errcode='23505'; end if;
 -- Same eligibility rules as paid content activation, with no client price/package.
 if target.id is null or target.user_id<>actor or target.is_published is not true
  or target.is_premium is true or target.is_subscriber_only is true or target.moderation_hidden
  or target.required_tier_id is not null or nullif(target.video_url,'') is null
  or target.post_type not in ('clipt','clipts','video') or target.created_at>statement_timestamp() then
  raise exception 'Clipt is not eligible for boosting' using errcode='42501'; end if;
 if exists(select 1 from public.content_boosts where post_id=p_post_id
  and invalidated_at is null and expires_at>activated) then
  raise exception 'This Clipt already has an active Boost' using errcode='23505'; end if;
 select * into package from public.boost_packages where code='squad_blast';
 if package.code is null or package.target_kind<>'clipt' or package.duration_seconds<>86400 then
  raise exception 'Squad Blast configuration unavailable' using errcode='22023'; end if;
 insert into public.content_boosts(id,user_id,post_id,original_post_id,package_code,idempotency_key,
  base_price,discount_percent,token_cost,activated_at,expires_at,ledger_id,funding_source,entitlement_week)
 values(result,actor,p_post_id,p_post_id,'squad_blast',p_idempotency_key,package.base_price,0,0,
  activated,activated+interval '24 hours',null,'premium_weekly',week_start);
 -- No Token credit, debit, ledger entry, cash value, or organic Trophy write.
 return result;
end $$;
revoke all on function clipt_private.redeem_weekly_squad_blast(uuid,uuid,date) from public,anon;
grant execute on function clipt_private.redeem_weekly_squad_blast(uuid,uuid,date) to authenticated;
create function public.redeem_weekly_squad_blast(p_post_id uuid,p_idempotency_key uuid,p_expected_week date)
 returns uuid language sql security invoker set search_path='' as $$
 select clipt_private.redeem_weekly_squad_blast(p_post_id,p_idempotency_key,p_expected_week);
$$;
revoke all on function public.redeem_weekly_squad_blast(uuid,uuid,date) from public,anon;
grant execute on function public.redeem_weekly_squad_blast(uuid,uuid,date) to authenticated;

create or replace function public.get_my_content_boosts() returns jsonb
 language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(b) order by b.activated_at desc),'[]'::jsonb) from (
  select id,original_post_id as post_id,package_code,base_price,discount_percent,token_cost,
   funding_source,entitlement_week,activated_at,expires_at,
   case when invalidated_at is not null or post_id is null then 'invalidated'
    when expires_at<=statement_timestamp() then 'expired' else 'active' end as state
  from public.content_boosts where user_id=auth.uid() order by activated_at desc limit 50
 ) b;
$$;

-- Free redemptions are not accounting records. Delete on owner erasure unless
-- an existing scoped legal/fraud hold requires review. Preserve the rest verbatim.
do $$ declare definition text; needle text:=$needle$category:=case when label in ('token_ledger'$needle$;
begin
 select pg_get_functiondef('clipt_private.erase_account_row(oid,jsonb,uuid,integer)'::regprocedure) into definition;
 if strpos(definition,needle)=0 then raise exception 'Erasure retention contract changed; review required'; end if;
 execute replace(definition,needle,$replacement$category:=case when label='content_boosts' and p_row->>'funding_source'='premium_weekly' then null when label in ('token_ledger'$replacement$);
end $$;
notify pgrst,'reload schema';
commit;

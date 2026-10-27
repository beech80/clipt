begin;

-- Add an explicit, server-owned identity; never infer entitlements from display
-- names, profile flags or the older unrelated tier catalogs. Preserve old rows.
alter table public.subscription_plans add column clipt_membership_code text
  check (clipt_membership_code in ('premium','maxed'));
create unique index clipt_membership_plan_code on public.subscription_plans(clipt_membership_code)
  where clipt_membership_code is not null;
revoke all on public.subscription_plans, public.subscription_tiers,
  public.user_subscriptions from public, anon, authenticated;
grant select on public.subscription_plans, public.subscription_tiers to anon, authenticated;
-- Existing posts policies reference this table for anonymous readers too.
-- Its owner-only RLS still returns no rows for anon.
grant select on public.user_subscriptions to anon, authenticated;

insert into public.subscription_plans(name,description,price,features,is_active,clipt_membership_code)
values
 ('Clipt Premium','Approved membership; sandbox fulfillment required',4.99,
  '{"boost_discount_percent":10,"daily_earned_token_cap":30,"stored_token_cap":400,"weekly_content_boost":true}',true,'premium'),
 ('Clipt Maxed','Approved membership; Mega Boost definition pending',14.99,
  '{"boost_discount_percent":20,"daily_earned_token_cap":50,"stored_token_cap":1000,"weekly_mega_boost_status":"definition_pending"}',true,'maxed');

create table public.boost_packages (
  code text primary key check(code in ('squad_blast','chain_reaction','king_now','stream_surge')),
  name text not null,
  base_price integer not null check(base_price>0),
  duration_seconds integer not null check(duration_seconds>0),
  target_kind text not null check(target_kind in ('clipt','stream')),
  description text not null
);
alter table public.boost_packages enable row level security;
revoke all on public.boost_packages from public,anon,authenticated;
grant select on public.boost_packages to authenticated;
grant all on public.boost_packages to service_role;
create policy clipt_boost_catalog_read on public.boost_packages for select to authenticated using(true);
insert into public.boost_packages values
 ('squad_blast','SQUAD BLAST',40,86400,'clipt','Relevant Squad and connected-user discovery opportunities. Initial distribution may reach up to 25 relevant users; no guaranteed impressions.'),
 ('chain_reaction','CHAIN REACTION',60,21600,'clipt','Genuine likes, shares or comments may expand relevant discovery opportunities in groups of up to five. No engagement is manufactured.'),
 ('king_now','I''M THE KING NOW',80,7200,'clipt','A clearly labeled boosted game spotlight, separate from organic Trophy rankings. No votes or ranking positions are purchased.'),
 ('stream_surge','STREAM SURGE',50,1800,'stream','Similar-interest discovery opportunities for a verified live stream. No guaranteed viewers. Distribution stops when the stream goes offline.');

-- This read-only snapshot is also the authoritative pricing source for the
-- forthcoming atomic activation function. No purchase endpoint is enabled here.
create function clipt_private.boost_economy()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=auth.uid(); membership text:='free'; discount integer:=0;
  daily_cap integer:=15; storage_cap integer:=200; result jsonb;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
    raise exception 'Authenticated account required' using errcode='42501';
  end if;
  select p.clipt_membership_code into membership
  from public.user_subscriptions s join public.subscription_plans p on p.id=s.plan_id
  where s.user_id=actor and s.status='active' and p.is_active
    and s.current_period_start<=statement_timestamp()
    and s.current_period_end>statement_timestamp() and p.clipt_membership_code is not null
  order by case p.clipt_membership_code when 'maxed' then 2 else 1 end desc limit 1;
  membership:=coalesce(membership,'free');
  if membership='premium' then discount:=10;daily_cap:=30;storage_cap:=400;
  elsif membership='maxed' then discount:=20;daily_cap:=50;storage_cap:=1000; end if;
  select jsonb_build_object('membership',membership,'discount_percent',discount,
    'daily_earned_cap',daily_cap,'stored_balance_cap',storage_cap,
    'balance',coalesce((select balance from public.token_wallets where user_id=actor),0),
    'weekly_content_boost_entitled',membership='premium',
    'weekly_mega_boost_status',case when membership='maxed' then 'definition_pending' else 'not_entitled' end,
    'packages',jsonb_agg(jsonb_build_object('code',b.code,'name',b.name,
      'base_price',b.base_price,'final_price',(b.base_price*(100-discount))/100,
      'duration_seconds',b.duration_seconds,'target_kind',b.target_kind,'description',b.description)
      order by b.base_price,b.code)) into result from public.boost_packages b;
  return result;
end;
$$;
revoke all on function clipt_private.boost_economy() from public,anon,authenticated;
grant execute on function clipt_private.boost_economy() to authenticated;
create function public.get_boost_economy() returns jsonb language sql stable security invoker
  set search_path='' as $$ select clipt_private.boost_economy(); $$;
revoke all on function public.get_boost_economy() from public,anon;
grant execute on function public.get_boost_economy() to authenticated;
notify pgrst,'reload schema';
commit;

begin;
create table public.content_boosts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id),
 post_id uuid references public.posts(id) on delete set null,
 original_post_id uuid not null,
 package_code text not null references public.boost_packages(code),
 idempotency_key uuid not null,
 base_price integer not null check(base_price>0),
 discount_percent integer not null check(discount_percent in (0,10,20)),
 token_cost integer not null check(token_cost>0),
 activated_at timestamptz not null default statement_timestamp(),
 expires_at timestamptz not null,
 invalidated_at timestamptz,
 ledger_id uuid not null unique references public.token_ledger(id),
 unique(user_id,idempotency_key),check(expires_at>activated_at),
 check(token_cost=base_price*(100-discount_percent)/100)
);
create index clipt_boost_owner_history on public.content_boosts(user_id,activated_at desc);
create index clipt_boost_target_active on public.content_boosts(post_id,expires_at) where invalidated_at is null;
alter table public.content_boosts enable row level security;
revoke all on public.content_boosts from public,anon,authenticated;
grant select on public.content_boosts to authenticated;
grant all on public.content_boosts to service_role;
create policy clipt_boost_owner_read on public.content_boosts for select to authenticated
 using(user_id=(select auth.uid()));

-- Invalidating is permanent: unhiding/re-publishing content does not resurrect
-- a previous paid distribution window. Keep financial audit records on deletion.
create function clipt_private.invalidate_content_boosts() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if tg_op='DELETE' then
  update public.content_boosts set invalidated_at=coalesce(invalidated_at,statement_timestamp()) where post_id=old.id;
  return old;
 end if;
 if new.is_published is not true or new.is_premium is true or new.is_subscriber_only is true
   or new.moderation_hidden or new.required_tier_id is not null
   or nullif(new.video_url,'') is null or new.post_type not in ('clipt','clipts','video')
   or new.user_id is distinct from old.user_id or new.game_id is distinct from old.game_id then
  update public.content_boosts set invalidated_at=coalesce(invalidated_at,statement_timestamp()) where post_id=new.id;
 end if;
 return new;
end $$;
revoke all on function clipt_private.invalidate_content_boosts() from public,anon,authenticated;
create trigger clipt_boost_content_invalidation before update or delete on public.posts
 for each row execute function clipt_private.invalidate_content_boosts();

create function clipt_private.activate_content_boost(p_post_id uuid,p_package_code text,p_idempotency_key uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); prior public.content_boosts%rowtype; target public.posts%rowtype;
 package public.boost_packages%rowtype; economy jsonb; price integer; discount integer;
 available bigint; boost_id uuid:=gen_random_uuid(); transaction_id uuid:=gen_random_uuid(); activated timestamptz;
begin
 if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
  raise exception 'Authenticated account required' using errcode='42501'; end if;
 if p_post_id is null or p_package_code is null or p_idempotency_key is null then
  raise exception 'Invalid Boost request' using errcode='22023'; end if;
 -- Lock target before wallet, matching moderation's post-before-Boost order.
 select * into target from public.posts where id=p_post_id for update;
 insert into public.token_wallets(user_id) values(actor) on conflict do nothing;
 select balance into available from public.token_wallets where user_id=actor for update;
 select * into prior from public.content_boosts where user_id=actor and idempotency_key=p_idempotency_key;
 if found then
  if prior.original_post_id<>p_post_id or prior.package_code<>p_package_code then
   raise exception 'Idempotency conflict' using errcode='22023'; end if;
  return prior.id;
 end if;
 if target.id is null or target.user_id<>actor or target.is_published is not true
   or target.is_premium is true or target.is_subscriber_only is true or target.moderation_hidden
   or target.required_tier_id is not null or nullif(target.video_url,'') is null
   or target.post_type not in ('clipt','clipts','video') or target.created_at>statement_timestamp() then
  raise exception 'Clipt is not eligible for boosting' using errcode='42501'; end if;
 select * into package from public.boost_packages where code=p_package_code;
 if package.code is null then raise exception 'Unknown Boost package' using errcode='22023'; end if;
 if package.target_kind<>'clipt' then
  raise exception 'Stream Surge requires provider-verified live activation' using errcode='22023'; end if;
 if p_package_code='king_now' and target.game_id is null then
  raise exception 'Game spotlight requires a selected game' using errcode='22023'; end if;
 activated:=clock_timestamp();
 if exists(select 1 from public.content_boosts where post_id=p_post_id and invalidated_at is null and expires_at>activated) then
  raise exception 'This Clipt already has an active Boost' using errcode='23505'; end if;
 economy:=clipt_private.boost_economy(); discount:=(economy->>'discount_percent')::integer;
 price:=package.base_price*(100-discount)/100;
 if available<price then raise exception 'Insufficient Tokens' using errcode='23514'; end if;
 insert into public.token_ledger(id,user_id,amount,kind,idempotency_key,reference_id,metadata)
 values(transaction_id,actor,-price,'BOOST','boost:'||p_idempotency_key,boost_id::text,
  jsonb_build_object('post_id',p_post_id,'package',p_package_code,'base_price',package.base_price,
    'discount_percent',discount,'token_cost',price));
 insert into public.content_boosts(id,user_id,post_id,original_post_id,package_code,idempotency_key,
   base_price,discount_percent,token_cost,activated_at,expires_at,ledger_id)
 values(boost_id,actor,p_post_id,p_post_id,p_package_code,p_idempotency_key,
   package.base_price,discount,price,activated,activated+make_interval(secs=>package.duration_seconds),transaction_id);
 update public.token_wallets set balance=balance-price,updated_at=activated where user_id=actor;
 return boost_id;
end $$;
revoke all on function clipt_private.activate_content_boost(uuid,text,uuid) from public,anon,authenticated;
-- Intentionally backend-only until distribution and browser confirmation pass.
grant execute on function clipt_private.activate_content_boost(uuid,text,uuid) to service_role;
create function public.activate_content_boost(p_post_id uuid,p_package_code text,p_idempotency_key uuid)
returns uuid language sql security invoker set search_path='' as $$
 select clipt_private.activate_content_boost(p_post_id,p_package_code,p_idempotency_key);
$$;
revoke all on function public.activate_content_boost(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.activate_content_boost(uuid,text,uuid) to service_role;
notify pgrst,'reload schema';
commit;

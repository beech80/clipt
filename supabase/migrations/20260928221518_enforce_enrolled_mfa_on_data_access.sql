BEGIN;
SET LOCAL lock_timeout='5s';
-- Preserve existing erasure/profile-existence boundary and add opt-in MFA.
-- Consult server-owned factors, never editable metadata or stale JWT enrollment.
CREATE OR REPLACE FUNCTION clipt_private.account_available()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $function$
 SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()))
 AND (
   coalesce((SELECT auth.jwt()->>'aal'),'aal1')='aal2'
   OR NOT EXISTS(SELECT 1 FROM auth.mfa_factors WHERE user_id=(SELECT auth.uid()) AND status='verified')
 );
$function$;
REVOKE ALL ON FUNCTION clipt_private.account_available() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION clipt_private.account_available() TO authenticated;
-- Existing restrictive public-table and Storage policies use this helper.
-- Privileged RPCs bypass RLS, so guard their implementations too.
CREATE OR REPLACE FUNCTION clipt_private.boost_economy()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare actor uuid:=auth.uid(); membership text:='free'; discount integer:=0;
  daily_cap integer:=15; storage_cap integer:=200; result jsonb;
begin
  IF NOT clipt_private.account_available() THEN
    RAISE EXCEPTION 'Authenticated account and enrolled MFA verification required' USING ERRCODE='42501';
  END IF;
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
$function$;

CREATE OR REPLACE FUNCTION clipt_private.boost_opportunities(p_game_id uuid)
 RETURNS TABLE(boost_id uuid, post_id uuid, package_code text, expires_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select b.id,b.post_id,b.package_code,b.expires_at
 from public.content_boosts b join public.posts p on p.id=b.post_id
 where (select clipt_private.account_available()) and auth.uid() is not null and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
  and b.invalidated_at is null and b.activated_at<=statement_timestamp() and b.expires_at>statement_timestamp()
  and p.user_id=b.user_id and p.is_published is true and p.is_premium is not true
  and p.is_subscriber_only is not true and not p.moderation_hidden and p.required_tier_id is null
  and nullif(p.video_url,'') is not null and p.post_type in ('clipt','clipts','video')
  and not clipt_private.blocked_with(p.user_id)
  and (p_game_id is null or p.game_id=p_game_id)
  and (
   (b.package_code='king_now' and p_game_id is not null and p.game_id=p_game_id)
   or (b.package_code='squad_blast' and auth.uid() in (
    select f.follower_id from public.follows f where f.following_id=b.user_id and f.follower_id<>b.user_id
    order by f.created_at desc,f.follower_id limit 25))
   or (b.package_code='chain_reaction' and (
    auth.uid() in (select f.follower_id from public.follows f where f.following_id=b.user_id
      and f.follower_id<>b.user_id order by f.created_at desc,f.follower_id limit 5)
    or exists (
     select 1 from (
      select l.user_id from public.likes l where l.post_id=b.post_id and l.user_id<>b.user_id
       and l.created_at>=b.activated_at and l.created_at<=statement_timestamp()
      union
      select c.user_id from public.comments c where c.post_id=b.post_id and c.user_id<>b.user_id
       and length(btrim(c.content))>0 and c.created_at>=b.activated_at and c.created_at<=statement_timestamp()
     ) genuine_actor
     cross join lateral (
      select f.follower_id from public.follows f where f.following_id=genuine_actor.user_id
       and f.follower_id<>b.user_id and f.follower_id<>genuine_actor.user_id
      order by f.created_at desc,f.follower_id limit 5
     ) expansion where expansion.follower_id=auth.uid()
    )
   ))
  ) order by b.activated_at desc,b.id limit 20;
$function$;

CREATE OR REPLACE FUNCTION clipt_private.check_chat_rate_limit(p_user_id uuid, p_stream_id uuid, p_limit integer DEFAULT 20, p_window_seconds integer DEFAULT 60)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE current_count integer;
BEGIN
  IF NOT clipt_private.account_available() THEN
    RAISE EXCEPTION 'Authenticated account and enrolled MFA verification required' USING ERRCODE='42501';
  END IF;
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501';
  END IF;
  IF p_stream_id IS NULL OR p_limit IS NULL OR p_window_seconds IS NULL
    OR p_limit NOT BETWEEN 1 AND 20 OR p_window_seconds NOT BETWEEN 60 AND 3600 THEN
    RAISE EXCEPTION 'Invalid rate limit' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.chat_rate_limits(user_id,stream_id,message_count,window_start)
    VALUES(p_user_id,p_stream_id,1,now())
    ON CONFLICT(user_id,stream_id) DO UPDATE SET
      message_count=CASE WHEN chat_rate_limits.window_start <= now()-make_interval(secs=>p_window_seconds) THEN 1 ELSE chat_rate_limits.message_count+1 END,
      window_start=CASE WHEN chat_rate_limits.window_start <= now()-make_interval(secs=>p_window_seconds) THEN now() ELSE chat_rate_limits.window_start END
    RETURNING message_count INTO current_count;
  RETURN current_count > p_limit;
END $function$;

CREATE OR REPLACE FUNCTION clipt_private.creator_dashboard_metrics(p_days integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  actor uuid := auth.uid();
  ends_at timestamptz := statement_timestamp();
  starts_at timestamptz;
  result jsonb;
begin
  IF NOT clipt_private.account_available() THEN
    RAISE EXCEPTION 'Authenticated account and enrolled MFA verification required' USING ERRCODE='42501';
  END IF;
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
    raise exception 'Authenticated account required' using errcode='42501';
  end if;
  if p_days is null or p_days not in (7,30,90,365) then
    raise exception 'Invalid analytics window' using errcode='22023';
  end if;
  starts_at := ends_at - make_interval(days => p_days);
  with owned as materialized (
    select p.id,p.content,p.created_at from public.posts p
    where p.user_id=actor and p.is_published=true and not p.moderation_hidden
      and p.post_type in ('clipt','clipts','video') and p.video_url is not null
  ), events as materialized (
    select v.post_id,v.created_at,'view'::text as kind from public.post_views v join owned p on p.id=v.post_id
      where v.created_at>=starts_at and v.created_at<=ends_at
    union all
    select l.post_id,l.created_at,'like' from public.likes l join owned p on p.id=l.post_id
      where l.created_at>=starts_at and l.created_at<=ends_at
    union all
    select v.post_id,v.created_at,'trophy' from public.clip_votes v join owned p on p.id=v.post_id
      where v.created_at>=starts_at and v.created_at<=ends_at
  ), top_posts as (
    select p.id,left(p.content,200) as caption,count(*) filter(where e.kind='trophy') as trophies,
      count(*) filter(where e.kind='like') as likes,count(*) filter(where e.kind='view') as views
    from owned p join events e on e.post_id=p.id group by p.id,p.content,p.created_at
    order by trophies desc,views desc,p.created_at asc,p.id asc limit 10
  ), daily as (
    select (e.created_at at time zone 'UTC')::date as day,
      count(*) filter(where kind='view') as views,count(*) filter(where kind='like') as likes,
      count(*) filter(where kind='trophy') as trophies from events e group by 1
  )
  select jsonb_build_object(
    'days',p_days,'from',starts_at,'to',ends_at,
    'views',(select count(*) from events where kind='view'),
    'likes',(select count(*) from events where kind='like'),
    'trophies',(select count(*) from events where kind='trophy'),
    'followers',(select count(*) from public.follows where following_id=actor and created_at>=starts_at and created_at<=ends_at),
    'daily',coalesce((select jsonb_agg(to_jsonb(d) order by d.day) from daily d),'[]'::jsonb),
    'top_clipts',coalesce((select jsonb_agg(to_jsonb(t)) from top_posts t),'[]'::jsonb)
  ) into result;
  return result;
end;
$function$;

CREATE OR REPLACE FUNCTION clipt_private.filter_chat_message(p_message text, p_stream_id uuid)
 RETURNS TABLE(filtered_message text, is_blocked boolean, filter_matched text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NOT clipt_private.account_available() THEN
    RAISE EXCEPTION 'Authenticated account and enrolled MFA verification required' USING ERRCODE='42501';
  END IF;
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
  IF p_stream_id IS NULL OR p_message IS NULL OR length(p_message) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Invalid message'; END IF;
  RETURN QUERY WITH matched_filter AS (
    SELECT pattern,filter_type,replacement,is_regex FROM public.chat_filters
    WHERE (stream_id=p_stream_id OR stream_id IS NULL) AND
      ((is_regex AND p_message ~* pattern) OR (NOT is_regex AND p_message ILIKE '%'||pattern||'%'))
    ORDER BY stream_id NULLS LAST,created_at DESC LIMIT 1
  ) SELECT CASE WHEN f.filter_type='replace' THEN CASE WHEN f.is_regex
      THEN regexp_replace(p_message,f.pattern,COALESCE(f.replacement,'*****'),'gi')
      ELSE replace(p_message,f.pattern,COALESCE(f.replacement,'*****')) END ELSE p_message END,
    f.filter_type='block',NULL::text FROM matched_filter f
    UNION ALL SELECT p_message,false,NULL::text WHERE NOT EXISTS(SELECT 1 FROM matched_filter);
END $function$;

CREATE OR REPLACE FUNCTION clipt_private.get_own_profile()
 RETURNS SETOF public.profiles
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT p.* FROM public.profiles p WHERE (SELECT clipt_private.account_available()) AND p.id=(SELECT auth.uid());
$function$;

CREATE OR REPLACE FUNCTION clipt_private.is_user_timed_out(p_user_id uuid, p_stream_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NOT clipt_private.account_available() THEN
    RAISE EXCEPTION 'Authenticated account and enrolled MFA verification required' USING ERRCODE='42501';
  END IF;
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501';
  END IF;
  RETURN EXISTS(SELECT 1 FROM public.chat_timeouts WHERE user_id=p_user_id AND stream_id=p_stream_id AND expires_at>now());
END $function$;

CREATE OR REPLACE FUNCTION clipt_private.purchase_content_boost(p_post_id uuid, p_package_code text, p_idempotency_key uuid, p_expected_cost integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare purchased uuid; charged integer;
begin
  IF NOT clipt_private.account_available() THEN
    RAISE EXCEPTION 'Authenticated account and enrolled MFA verification required' USING ERRCODE='42501';
  END IF;
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
  raise exception 'Authenticated account required' using errcode='42501'; end if;
 if p_expected_cost is null or p_expected_cost<1 or p_expected_cost>1000000 then
  raise exception 'Invalid price confirmation' using errcode='22023'; end if;
 purchased:=clipt_private.activate_content_boost(p_post_id,p_package_code,p_idempotency_key);
 select token_cost into charged from public.content_boosts where id=purchased and user_id=auth.uid();
 if charged is distinct from p_expected_cost then
  raise exception 'Price changed; refresh and confirm again. No new Tokens were charged.' using errcode='22023'; end if;
 return purchased;
end $function$;

CREATE OR REPLACE FUNCTION clipt_private.purchase_stream_gift(p_stream_id uuid, p_gift_id uuid, p_idempotency_key uuid, p_message text DEFAULT ''::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare actor uuid:=auth.uid(); price_value bigint; recipient uuid; available bigint;
  previous public.token_ledger%rowtype; gift_event uuid; identity jsonb;
begin
  IF NOT clipt_private.account_available() THEN
    RAISE EXCEPTION 'Authenticated account and enrolled MFA verification required' USING ERRCODE='42501';
  END IF;
  if actor is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_stream_id is null or p_gift_id is null or p_idempotency_key is null or length(coalesce(p_message,''))>200 then raise exception 'Invalid gift request' using errcode='22023'; end if;
  identity:=jsonb_build_object('stream_id',p_stream_id,'gift_id',p_gift_id,'message',coalesce(p_message,''));
  insert into public.token_wallets(user_id) values(actor) on conflict do nothing;
  select balance into available from public.token_wallets where user_id=actor for update;
  select * into previous from public.token_ledger where user_id=actor and idempotency_key='gift:'||p_idempotency_key;
  if found then
    if previous.metadata is distinct from identity or previous.kind<>'GIFT' then raise exception 'Idempotency conflict' using errcode='22023'; end if;
    return previous.reference_id::uuid;
  end if;
  select user_id into recipient from public.streams where id=p_stream_id and is_live is true;
  if recipient is null or recipient=actor or clipt_private.blocked_with(recipient) then raise exception 'Stream unavailable for gifting' using errcode='42501'; end if;
  if exists(select 1 from public.chat_timeouts where stream_id=p_stream_id and user_id=actor and expires_at>now()) then raise exception 'Stream access restricted' using errcode='42501'; end if;
  select price::bigint into price_value from public.virtual_gifts
    where id=p_gift_id and is_active and price>0 and price=trunc(price) and price<=1000000;
  if price_value is null then raise exception 'Gift unavailable' using errcode='22023'; end if;
  if available<price_value then raise exception 'Insufficient tokens' using errcode='22023'; end if;
  insert into public.stream_gifts(stream_id,sender_id,gift_id,amount,quantity,message)
    values(p_stream_id,actor,p_gift_id,price_value,1,nullif(p_message,'')) returning id into gift_event;
  insert into public.token_ledger(user_id,amount,kind,idempotency_key,reference_id,metadata)
    values(actor,-price_value,'GIFT','gift:'||p_idempotency_key,gift_event::text,identity);
  update public.token_wallets set balance=balance-price_value,updated_at=now() where user_id=actor;
  return gift_event;
end;
$function$;

CREATE OR REPLACE FUNCTION clipt_private.review_content_report(report_id uuid, decision text, moderator_notes text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare report public.content_reports; actor uuid := auth.uid();
begin
  IF NOT clipt_private.account_available() THEN
    RAISE EXCEPTION 'Authenticated account and enrolled MFA verification required' USING ERRCODE='42501';
  END IF;
  if actor is null or not exists (select 1 from public.user_roles r where r.user_id=actor and r.role in ('admin','moderator')) then
    raise exception 'Moderator role required' using errcode='42501';
  end if;
  if decision is null or decision not in ('dismiss','hide_post') or char_length(coalesce(moderator_notes,''))>2000 then
    raise exception 'Invalid review decision' using errcode='22023';
  end if;
  select * into report from public.content_reports where id=report_id for update;
  if not found then raise exception 'Report not found' using errcode='P0002'; end if;
  if report.status not in ('pending','reviewed') then
    raise exception 'Report already resolved' using errcode='22023';
  end if;
  if decision='hide_post' then
    if report.content_type <> 'post' then raise exception 'Only posts support hiding' using errcode='22023'; end if;
    update public.posts set moderation_hidden=true where id=report.content_id;
    if not found then raise exception 'Reported post no longer exists' using errcode='P0002'; end if;
  end if;
  update public.content_reports set status=case when decision='dismiss' then 'dismissed' else 'resolved' end,
    action_taken=case when decision='dismiss' then 'dismissed' else 'post_hidden' end,
    resolved_by=actor, resolved_at=statement_timestamp(), resolution_notes=nullif(btrim(moderator_notes),'')
    where id=report_id;
  return report_id;
end;
$function$;

CREATE OR REPLACE FUNCTION clipt_private.update_stream_quality(stream_id uuid, new_settings jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE result jsonb; current_session uuid;
BEGIN
  IF NOT clipt_private.account_available() THEN
    RAISE EXCEPTION 'Authenticated account and enrolled MFA verification required' USING ERRCODE='42501';
  END IF;
  IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.streams s WHERE s.id=$1 AND s.user_id=auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501';
  END IF;
  IF jsonb_typeof(new_settings) IS DISTINCT FROM 'object' OR octet_length(new_settings::text)>16384 THEN RAISE EXCEPTION 'Invalid settings'; END IF;
  SELECT e.id INTO current_session FROM public.stream_encoding_sessions e WHERE e.stream_id=$1 AND e.status='active' ORDER BY e.started_at DESC LIMIT 1;
  IF current_session IS NULL THEN RAISE EXCEPTION 'No active encoding session'; END IF;
  UPDATE public.stream_encoding_sessions SET current_settings=new_settings WHERE id=current_session
    RETURNING jsonb_build_object('session_id',id,'settings',current_settings,'updated_at',updated_at) INTO result;
  RETURN result;
END $function$;

COMMIT;

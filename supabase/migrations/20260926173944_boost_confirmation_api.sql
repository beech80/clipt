begin;
-- The expected cost is a confirmation constraint, never the pricing source.
-- Raising after activation rolls back BOTH its insert and debit if a membership
-- expired or server prices changed since the confirmation screen was displayed.
create function clipt_private.purchase_content_boost(p_post_id uuid,p_package_code text,p_idempotency_key uuid,p_expected_cost integer)
returns uuid language plpgsql security definer set search_path='' as $$
declare purchased uuid; charged integer;
begin
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
  raise exception 'Authenticated account required' using errcode='42501'; end if;
 if p_expected_cost is null or p_expected_cost<1 or p_expected_cost>1000000 then
  raise exception 'Invalid price confirmation' using errcode='22023'; end if;
 purchased:=clipt_private.activate_content_boost(p_post_id,p_package_code,p_idempotency_key);
 select token_cost into charged from public.content_boosts where id=purchased and user_id=auth.uid();
 if charged is distinct from p_expected_cost then
  raise exception 'Price changed; refresh and confirm again. No new Tokens were charged.' using errcode='22023'; end if;
 return purchased;
end $$;
revoke all on function clipt_private.purchase_content_boost(uuid,text,uuid,integer) from public,anon,authenticated;
grant execute on function clipt_private.purchase_content_boost(uuid,text,uuid,integer) to authenticated;
create function public.purchase_content_boost(p_post_id uuid,p_package_code text,p_idempotency_key uuid,p_expected_cost integer)
returns uuid language sql security invoker set search_path='' as $$
 select clipt_private.purchase_content_boost(p_post_id,p_package_code,p_idempotency_key,p_expected_cost);
$$;
revoke all on function public.purchase_content_boost(uuid,text,uuid,integer) from public,anon;
grant execute on function public.purchase_content_boost(uuid,text,uuid,integer) to authenticated;

create function public.get_my_content_boosts() returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(b) order by b.activated_at desc),'[]'::jsonb) from (
  select id,original_post_id as post_id,package_code,base_price,discount_percent,token_cost,
   activated_at,expires_at,case when invalidated_at is not null or post_id is null then 'invalidated'
    when expires_at<=statement_timestamp() then 'expired' else 'active' end as state
  from public.content_boosts where user_id=auth.uid() order by activated_at desc limit 50
 ) b;
$$;
revoke all on function public.get_my_content_boosts() from public,anon;
grant execute on function public.get_my_content_boosts() to authenticated;
notify pgrst,'reload schema';
commit;

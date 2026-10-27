begin;
-- Backend-only lookup. No caller-supplied tier, profile flag or JWT metadata.
create function clipt_private.token_limits(p_user_id uuid)
returns table(daily_cap integer,storage_cap integer)
language sql stable security definer set search_path='' as $$
 select case coalesce(max(case p.clipt_membership_code when 'maxed' then 2 when 'premium' then 1 else 0 end),0)
   when 2 then 50 when 1 then 30 else 15 end,
  case coalesce(max(case p.clipt_membership_code when 'maxed' then 2 when 'premium' then 1 else 0 end),0)
   when 2 then 1000 when 1 then 400 else 200 end
 from public.user_subscriptions s join public.subscription_plans p on p.id=s.plan_id
 where s.user_id=p_user_id and s.status='active' and p.is_active
   and s.current_period_start<=statement_timestamp() and s.current_period_end>statement_timestamp();
$$;
revoke all on function clipt_private.token_limits(uuid) from public,anon,authenticated;

create function clipt_private.guard_token_storage_cap() returns trigger
language plpgsql security definer set search_path='' as $$
declare cap integer;
begin
 -- Grandfather existing balances: reads and spending continue after downgrade.
 -- Never trim an existing balance or rewrite its transaction history.
 if tg_op='UPDATE' then
  if new.balance<=old.balance then return new; end if;
 end if;
 if new.balance=0 then return new; end if;
 select storage_cap into cap from clipt_private.token_limits(new.user_id);
 if new.balance>cap then raise exception 'Token storage limit reached' using errcode='23514'; end if;
 return new;
end $$;
revoke all on function clipt_private.guard_token_storage_cap() from public,anon,authenticated;
create trigger clipt_token_storage_cap before insert or update of balance on public.token_wallets
 for each row execute function clipt_private.guard_token_storage_cap();

create function clipt_private.guard_daily_token_rewards() returns trigger
language plpgsql security definer set search_path='' as $$
declare cap integer; earned bigint; starts_at timestamptz;
begin
 if new.kind<>'REWARD' then return new; end if;
 if new.amount<=0 then raise exception 'Reward amount must be positive' using errcode='23514'; end if;
 insert into public.token_wallets(user_id) values(new.user_id) on conflict do nothing;
 perform 1 from public.token_wallets where user_id=new.user_id for update;
 new.created_at:=clock_timestamp();
 starts_at:=date_trunc('day',new.created_at at time zone 'UTC') at time zone 'UTC';
 select daily_cap into cap from clipt_private.token_limits(new.user_id);
 select coalesce(sum(amount),0) into earned from public.token_ledger
  where user_id=new.user_id and kind='REWARD' and created_at>=starts_at and created_at<starts_at+interval '1 day';
 if earned+new.amount>cap then raise exception 'Daily earned Token limit reached' using errcode='23514'; end if;
 return new;
end $$;
revoke all on function clipt_private.guard_daily_token_rewards() from public,anon,authenticated;
create trigger clipt_daily_token_rewards before insert on public.token_ledger
 for each row execute function clipt_private.guard_daily_token_rewards();
commit;

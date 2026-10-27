begin;
-- Compatible with the earlier local-only ledger foundation; no existing
-- purchases or gift events are credited or rewritten by this migration.
create table if not exists public.token_wallets (
  user_id uuid primary key references auth.users(id),
  balance bigint not null default 0 check (balance between 0 and 9007199254740991),
  updated_at timestamptz not null default now()
);
create table if not exists public.token_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  amount bigint not null check (amount <> 0),
  kind text not null check (kind in ('PURCHASE','REWARD','GIFT','BOOST','REFUND')),
  idempotency_key text not null check (length(idempotency_key) between 1 and 200),
  reference_id text not null, metadata jsonb not null default '{}',
  created_at timestamptz not null default now(), unique(user_id,idempotency_key)
);
alter table public.token_wallets enable row level security;
alter table public.token_ledger enable row level security;
revoke all on public.token_wallets, public.token_ledger from public, anon, authenticated;
grant select on public.token_wallets, public.token_ledger to authenticated;
grant all on public.token_wallets, public.token_ledger to service_role;
create policy clipt_wallet_owner_read on public.token_wallets for select to authenticated using(user_id=(select auth.uid()));
create policy clipt_ledger_owner_read on public.token_ledger for select to authenticated using(user_id=(select auth.uid()));
create index if not exists clipt_ledger_history on public.token_ledger(user_id,created_at desc,id);
create unique index clipt_purchase_reference_once on public.token_ledger(reference_id) where kind='PURCHASE';

create or replace function clipt_private.credit_token_purchase(p_user_id uuid,p_amount bigint,p_reference text)
returns uuid language plpgsql security definer set search_path='' as $$
declare previous public.token_ledger%rowtype; ledger_id uuid;
begin
  if p_user_id is null or p_amount is null or p_amount<=0 or p_amount>1000000 or p_reference is null or length(p_reference) not between 1 and 160 then
    raise exception 'Invalid purchase' using errcode='22023';
  end if;
  insert into public.token_wallets(user_id) values(p_user_id) on conflict do nothing;
  perform 1 from public.token_wallets where user_id=p_user_id for update;
  select * into previous from public.token_ledger where user_id=p_user_id and idempotency_key='purchase:'||p_reference;
  if found then
    if previous.amount<>p_amount or previous.kind<>'PURCHASE' then raise exception 'Idempotency conflict' using errcode='22023'; end if;
    return previous.id;
  end if;
  insert into public.token_ledger(user_id,amount,kind,idempotency_key,reference_id)
    values(p_user_id,p_amount,'PURCHASE','purchase:'||p_reference,p_reference) returning id into ledger_id;
  update public.token_wallets set balance=balance+p_amount,updated_at=now() where user_id=p_user_id;
  return ledger_id;
end;
$$;
revoke all on function clipt_private.credit_token_purchase(uuid,bigint,text) from public,anon,authenticated;
grant usage on schema clipt_private to service_role;
grant execute on function clipt_private.credit_token_purchase(uuid,bigint,text) to service_role;
create or replace function public.credit_token_purchase(p_user_id uuid,p_amount bigint,p_reference text)
returns uuid language sql security invoker set search_path='' as $$
  select clipt_private.credit_token_purchase(p_user_id,p_amount,p_reference);
$$;
revoke all on function public.credit_token_purchase(uuid,bigint,text) from public,anon,authenticated;
grant execute on function public.credit_token_purchase(uuid,bigint,text) to service_role;

create or replace function clipt_private.purchase_stream_gift(p_stream_id uuid,p_gift_id uuid,p_idempotency_key uuid,p_message text default '')
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); price_value bigint; recipient uuid; available bigint;
  previous public.token_ledger%rowtype; gift_event uuid; identity jsonb;
begin
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
$$;
revoke all on function clipt_private.purchase_stream_gift(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function clipt_private.purchase_stream_gift(uuid,uuid,uuid,text) to authenticated;
create or replace function public.purchase_stream_gift(p_stream_id uuid,p_gift_id uuid,p_idempotency_key uuid,p_message text default '')
returns uuid language sql security invoker set search_path='' as $$
  select clipt_private.purchase_stream_gift(p_stream_id,p_gift_id,p_idempotency_key,p_message);
$$;
revoke all on function public.purchase_stream_gift(uuid,uuid,uuid,text) from public,anon;
grant execute on function public.purchase_stream_gift(uuid,uuid,uuid,text) to authenticated;
revoke insert,update,delete on public.virtual_gifts,public.stream_gifts from public,anon,authenticated;
create policy clipt_gift_sender_read on public.stream_gifts for select to authenticated using(sender_id=(select auth.uid()));
notify pgrst,'reload schema';
commit;

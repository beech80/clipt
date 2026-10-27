-- Development/staging foundation; no raw user-to-user token transfers.
create table public.token_wallets (
  user_id uuid primary key references auth.users(id),
  balance bigint not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);
create table public.token_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  amount bigint not null check (amount <> 0),
  kind text not null check (kind in ('PURCHASE','REWARD','GIFT','BOOST','REFUND')),
  idempotency_key text not null check (length(idempotency_key) between 1 and 200),
  reference_id text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(user_id,idempotency_key)
);
alter table public.token_wallets enable row level security;
alter table public.token_ledger enable row level security;
revoke all on public.token_wallets, public.token_ledger from anon, authenticated;
grant select on public.token_wallets, public.token_ledger to authenticated;
create policy clipt_own_wallet on public.token_wallets for select to authenticated using(user_id=auth.uid());
create policy clipt_own_ledger on public.token_ledger for select to authenticated using(user_id=auth.uid());
create index clipt_ledger_history on public.token_ledger(user_id,created_at desc,id);

create or replace function public.credit_token_purchase(
  p_user_id uuid, p_amount bigint, p_reference text
) returns uuid language plpgsql security definer set search_path='' as $$
declare previous public.token_ledger%rowtype; ledger_id uuid;
begin
  if p_amount <= 0 or p_amount > 1000000 or length(p_reference) not between 1 and 160 then
    raise exception 'Invalid purchase';
  end if;
  insert into public.token_wallets(user_id) values(p_user_id) on conflict do nothing;
  perform 1 from public.token_wallets where user_id=p_user_id for update;
  select * into previous from public.token_ledger where user_id=p_user_id and idempotency_key='purchase:'||p_reference;
  if found then
    if previous.amount <> p_amount or previous.kind <> 'PURCHASE' then raise exception 'Idempotency conflict'; end if;
    return previous.id;
  end if;
  insert into public.token_ledger(user_id,amount,kind,idempotency_key,reference_id)
    values(p_user_id,p_amount,'PURCHASE','purchase:'||p_reference,p_reference) returning id into ledger_id;
  update public.token_wallets set balance=balance+p_amount,updated_at=now() where user_id=p_user_id;
  return ledger_id;
end;
$$;
revoke all on function public.credit_token_purchase(uuid,bigint,text) from public,anon,authenticated;
grant execute on function public.credit_token_purchase(uuid,bigint,text) to service_role;

create or replace function public.purchase_stream_gift(
  p_stream_id uuid, p_gift_id uuid, p_idempotency_key uuid, p_message text default ''
) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); price_value bigint; recipient uuid; available bigint;
  previous public.token_ledger%rowtype; gift_event uuid; identity jsonb;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_idempotency_key is null or length(coalesce(p_message,'')) > 200 then raise exception 'Invalid gift request'; end if;
  identity:=jsonb_build_object('stream_id',p_stream_id,'gift_id',p_gift_id,'message',coalesce(p_message,''));
  insert into public.token_wallets(user_id) values(actor) on conflict do nothing;
  select balance into available from public.token_wallets where user_id=actor for update;
  select * into previous from public.token_ledger where user_id=actor and idempotency_key='gift:'||p_idempotency_key;
  if found then
    if previous.metadata is distinct from identity or previous.kind <> 'GIFT' then raise exception 'Idempotency conflict'; end if;
    return previous.reference_id::uuid;
  end if;
  select user_id into recipient from public.streams where id=p_stream_id and is_live;
  if recipient is null or recipient=actor then raise exception 'Stream is unavailable for gifting'; end if;
  if exists(select 1 from public.chat_timeouts where stream_id=p_stream_id and user_id=actor and expires_at>now()) then
    raise exception 'Stream access restricted' using errcode='42501';
  end if;
  select price::bigint into price_value from public.virtual_gifts
    where id=p_gift_id and is_active and price>0 and price=trunc(price) and price<=1000000;
  if price_value is null then raise exception 'Gift is unavailable'; end if;
  if available < price_value then raise exception 'Insufficient tokens'; end if;
  insert into public.stream_gifts(stream_id,sender_id,gift_id,amount,quantity,message)
    values(p_stream_id,actor,p_gift_id,price_value,1,nullif(p_message,'')) returning id into gift_event;
  insert into public.token_ledger(user_id,amount,kind,idempotency_key,reference_id,metadata)
    values(actor,-price_value,'GIFT','gift:'||p_idempotency_key,gift_event::text,identity);
  update public.token_wallets set balance=balance-price_value,updated_at=now() where user_id=actor;
  return gift_event;
end;
$$;
revoke all on function public.purchase_stream_gift(uuid,uuid,uuid,text) from public,anon;
grant execute on function public.purchase_stream_gift(uuid,uuid,uuid,text) to authenticated;
revoke insert,update,delete on public.virtual_gifts,public.stream_gifts from anon,authenticated;

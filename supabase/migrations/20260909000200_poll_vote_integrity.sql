-- Development/staging only: reconcile the existing normalized poll tables.
alter table public.stream_polls add column if not exists options jsonb not null default '[]';
alter table public.stream_polls add column if not exists creator_id uuid references public.profiles(id);
alter table public.stream_polls add column if not exists ends_at timestamptz;
alter table public.poll_votes add column if not exists poll_id uuid references public.stream_polls(id) on delete cascade;
update public.poll_votes v set poll_id = o.poll_id from public.poll_options o
where o.id = v.option_id and v.poll_id is null;
alter table public.poll_votes alter column poll_id set not null;
create unique index clipt_poll_single_vote on public.poll_votes(poll_id, user_id);

create or replace function public.clipt_initialize_poll_options()
returns trigger language plpgsql security definer set search_path = '' as $$
declare item jsonb;
begin
  if jsonb_typeof(new.options) <> 'array' or jsonb_array_length(new.options) not between 2 and 5 then
    raise exception 'A poll requires 2-5 options';
  end if;
  for item in select value from jsonb_array_elements(new.options) loop
    if length(trim(item->>'text')) not between 1 and 200 then raise exception 'Invalid poll option'; end if;
    insert into public.poll_options(id, poll_id, option_text, vote_count)
    values ((item->>'id')::uuid, new.id, trim(item->>'text'), 0);
  end loop;
  return new;
end;
$$;
create trigger clipt_initialize_poll_options after insert on public.stream_polls
for each row execute function public.clipt_initialize_poll_options();

create or replace function public.cast_stream_poll_vote(p_poll_id uuid, p_option_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare poll public.stream_polls%rowtype; selected_poll uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into poll from public.stream_polls where id=p_poll_id for update;
  if not found or not poll.is_active or (poll.ends_at is not null and poll.ends_at <= now()) then
    raise exception 'Poll is closed';
  end if;
  if not exists (select 1 from public.streams where id=poll.stream_id and is_live) then
    raise exception 'Stream is offline';
  end if;
  if exists (select 1 from public.chat_timeouts where stream_id=poll.stream_id and user_id=auth.uid() and expires_at>now()) then
    raise exception 'Chat access restricted' using errcode='42501';
  end if;
  select poll_id into selected_poll from public.poll_options where id=p_option_id;
  if selected_poll is distinct from p_poll_id then raise exception 'Invalid option'; end if;
  insert into public.poll_votes(poll_id,option_id,user_id)
    values(p_poll_id,p_option_id,auth.uid()) on conflict(poll_id,user_id) do nothing;
  -- Recompute from the ledger, including repeated delivery, rather than adding twice.
  update public.stream_polls set options = (
    select jsonb_agg(jsonb_build_object('id',o.id,'text',o.option_text,'votes',
      (select count(*) from public.poll_votes v where v.option_id=o.id)) order by o.id)
    from public.poll_options o where o.poll_id=p_poll_id
  ) where id=p_poll_id;
end;
$$;
revoke all on function public.cast_stream_poll_vote(uuid,uuid) from public, anon;
grant execute on function public.cast_stream_poll_vote(uuid,uuid) to authenticated;
revoke insert, update, delete on public.poll_votes from anon, authenticated;
alter table public.poll_votes enable row level security;
create policy clipt_read_own_poll_votes on public.poll_votes for select to authenticated using (user_id=auth.uid());
grant select on public.poll_votes to authenticated;

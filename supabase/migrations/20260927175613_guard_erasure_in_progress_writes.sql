begin;
-- RLS does not constrain trusted SECURITY DEFINER RPCs. Prevent their INSERTs
-- from recreating a wallet or other account record during external cleanup.
create function clipt_private.reject_erasing_identity() returns trigger
language plpgsql security definer set search_path='' as $$
declare column_name text; actor text;
begin
 foreach column_name in array tg_argv loop
  actor:=to_jsonb(new)->>column_name;
  if actor is not null and exists(select 1 from clipt_private.erasure_jobs where user_id::text=actor and state='cleanup') then
   raise exception 'Account deletion is in progress' using errcode='42501';
  end if;
 end loop;
 return new;
end $$;
revoke all on function clipt_private.reject_erasing_identity() from public,anon,authenticated;
do $$ declare t record; begin
 for t in select c.conrelid,string_agg(distinct quote_literal(a.attname),',') args
  from pg_constraint c join pg_namespace n on n.oid=c.connamespace
  join pg_attribute a on a.attrelid=c.conrelid and a.attnum=c.conkey[1]
  where c.contype='f' and c.confrelid in ('auth.users'::regclass,'public.profiles'::regclass) and n.nspname='public'
  group by c.conrelid
 loop
  execute format('create trigger clipt_erasure_insert_guard before insert on %s for each row execute function clipt_private.reject_erasing_identity(%s)',t.conrelid::regclass,t.args);
 end loop;
end $$;
commit;

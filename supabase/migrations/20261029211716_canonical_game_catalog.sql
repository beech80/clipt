-- Preserve old IDs and their content; one canonical channel per identical legacy title.
alter table public.games add column if not exists canonical_game_id uuid references public.games(id);
alter table public.games add column if not exists igdb_id bigint;
alter table public.games add column if not exists release_year integer;
alter table public.games add column if not exists platforms text;
alter table public.games add constraint games_canonical_not_self check (canonical_game_id is null or canonical_game_id <> id);
alter table public.games add constraint games_provider_id_positive check (igdb_id is null or igdb_id > 0);
create unique index if not exists games_igdb_identity_idx on public.games(igdb_id) where igdb_id is not null;
create index if not exists games_canonical_alias_idx on public.games(canonical_game_id);
with duplicates as (
 select id,first_value(id) over (partition by lower(regexp_replace(btrim(name),'[[:space:]]+',' ','g')) order by created_at,id) as canonical
 from public.games where canonical_game_id is null and igdb_id is null
)
update public.games g set canonical_game_id=d.canonical from duplicates d where g.id=d.id and d.id<>d.canonical;

-- Only the verified server importer can create or edit catalog identities.
drop policy if exists "Allow authenticated users to insert/update games" on public.games;
revoke insert,update,delete,truncate,references,trigger on public.games from anon,authenticated;
grant select on public.games to anon,authenticated;

create or replace view public.game_channel_catalog with(security_invoker=true,security_barrier=true) as
 select g.id,g.name,g.cover_url,g.igdb_id,g.release_year,g.platforms,
 array(select a.id from public.games a where a.id=g.id or a.canonical_game_id=g.id order by a.id) as member_ids
 from public.games g where g.canonical_game_id is null;
revoke all on public.game_channel_catalog from public,anon,authenticated;
grant select on public.game_channel_catalog to anon,authenticated;

create or replace function public.cache_verified_game(p_provider_id bigint,p_name text,p_cover_url text,p_release_year integer,p_platforms text,p_adopt_legacy boolean default false)
returns jsonb language plpgsql security invoker set search_path=pg_catalog,public as $$
declare result public.games; clean_name text:=btrim(p_name);
begin
 if p_provider_id is null or p_provider_id<=0 or clean_name is null or length(clean_name) not between 1 and 240
 or (p_cover_url is not null and p_cover_url !~ '^https://images[.]igdb[.]com/igdb/image/upload/t_cover_big/[A-Za-z0-9_-]+[.]jpg$')
 or (p_release_year is not null and p_release_year not between 1000 and 9999)
 or length(coalesce(p_platforms,''))>1000 then raise exception 'Invalid verified game metadata' using errcode='22023';end if;
 perform pg_advisory_xact_lock(p_provider_id);
 select * into result from public.games where igdb_id=p_provider_id;
 if found then return to_jsonb(result);end if;
 if p_adopt_legacy then
  select * into result from public.games where canonical_game_id is null and igdb_id is null
  and lower(regexp_replace(btrim(name),'[[:space:]]+',' ','g'))=lower(regexp_replace(clean_name,'[[:space:]]+',' ','g'))
  order by created_at,id limit 1 for update;
 end if;
 if result.id is not null then
  update public.games set igdb_id=p_provider_id,cover_url=coalesce(p_cover_url,cover_url),release_year=p_release_year,platforms=p_platforms
  where id=result.id and igdb_id is null returning * into result;
 else
  insert into public.games(name,cover_url,igdb_id,release_year,platforms)
  values(clean_name,p_cover_url,p_provider_id,p_release_year,p_platforms) returning * into result;
 end if;
 return to_jsonb(result);
end;$$;
revoke all on function public.cache_verified_game(bigint,text,text,integer,text,boolean) from public,anon,authenticated;
grant execute on function public.cache_verified_game(bigint,text,text,integer,text,boolean) to service_role;

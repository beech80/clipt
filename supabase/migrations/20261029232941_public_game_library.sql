-- Extend verified game identity; keep all existing channel IDs, grants and RLS.
alter table public.games add column if not exists wikidata_id text;
alter table public.games add constraint games_wikidata_identity_valid check(wikidata_id is null or wikidata_id ~ '^Q[1-9][0-9]{0,15}$');
create unique index if not exists games_wikidata_identity_idx on public.games(wikidata_id) where wikidata_id is not null;
create or replace function public.cache_verified_public_game(p_wikidata_id text,p_name text,p_release_year integer,p_platforms text,p_igdb_id bigint default null,p_adopt_legacy boolean default false)
returns jsonb language plpgsql security invoker set search_path=pg_catalog,public as $$
declare result public.games;clean_name text:=btrim(p_name);
begin
 if p_wikidata_id is null or p_wikidata_id !~ '^Q[1-9][0-9]{0,15}$'
 or clean_name is null or length(clean_name) not between 1 and 240 or clean_name ~ '[[:cntrl:]]'
 or (p_release_year is not null and p_release_year not between 1000 and 9999)
 or (p_igdb_id is not null and p_igdb_id<=0) or length(coalesce(p_platforms,''))>1000
 then raise exception 'Invalid verified public game metadata' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('public-game:'||p_wikidata_id,0));
 if p_igdb_id is not null then perform pg_advisory_xact_lock(p_igdb_id);end if;
 select * into result from public.games where wikidata_id=p_wikidata_id;
 if found then return to_jsonb(result);end if;
 if p_igdb_id is not null then
  select * into result from public.games where igdb_id=p_igdb_id for update;
  if found then
   if result.wikidata_id is null then update public.games set wikidata_id=p_wikidata_id where id=result.id returning * into result;end if;
   return to_jsonb(result);
  end if;
 end if;
 if p_adopt_legacy then
  select * into result from public.games where canonical_game_id is null and igdb_id is null and wikidata_id is null
  and lower(regexp_replace(btrim(name),'[[:space:]]+',' ','g'))=lower(regexp_replace(clean_name,'[[:space:]]+',' ','g'))
  and (release_year is null or release_year=p_release_year) order by created_at,id limit 1 for update;
 end if;
 if result.id is not null then
  update public.games set wikidata_id=p_wikidata_id,igdb_id=p_igdb_id,release_year=coalesce(p_release_year,release_year),platforms=coalesce(p_platforms,platforms)
  where id=result.id returning * into result;
 else
  insert into public.games(name,wikidata_id,igdb_id,release_year,platforms)
  values(clean_name,p_wikidata_id,p_igdb_id,p_release_year,p_platforms) returning * into result;
 end if;
 return to_jsonb(result);
end;$$;
revoke all on function public.cache_verified_public_game(text,text,integer,text,bigint,boolean) from public,anon,authenticated;
grant execute on function public.cache_verified_public_game(text,text,integer,text,bigint,boolean) to service_role;

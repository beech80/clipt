-- REVIEW CANDIDATE: apply once to production project slnjliheyiiummxhrgmk
-- only after release approval. This file does not provision Mux/Azure resources,
-- publish a frontend, modify media bytes, enable payments, or admit new users.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $preflight$
BEGIN
 IF to_regprocedure('clipt_private.account_available()') IS NULL
 OR to_regprocedure('clipt_private.blocked_with(uuid)') IS NULL
 OR to_regprocedure('clipt_private.beta_access_allowed()') IS NULL
 OR to_regclass('clipt_private.erasure_tables') IS NULL
 THEN RAISE EXCEPTION 'Existing account, block, beta and erasure boundaries are required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM clipt_private.beta_access_config WHERE enabled)
 THEN RAISE EXCEPTION 'Invite-only beta must remain enabled'; END IF;
 IF EXISTS(SELECT 1 FROM storage.buckets WHERE public)
 THEN RAISE EXCEPTION 'Private-media boundary must remain enabled'; END IF;
 IF to_regprocedure('clipt_private.photo_review_held(uuid)') IS NULL
 AND (to_regclass('clipt_private.azure_review_dispatch') IS NOT NULL OR to_regclass('clipt_private.azure_dispatch_settings') IS NOT NULL)
 THEN RAISE EXCEPTION 'Photo review boundary is incomplete; reconcile before release'; END IF;
 IF to_regclass('public.user_mutes') IS NOT NULL OR to_regclass('public.scheduled_streams') IS NOT NULL
 OR to_regclass('public.game_channel_catalog') IS NOT NULL OR to_regclass('public.public_channel_posts') IS NOT NULL
 OR EXISTS(SELECT 1 FROM pg_catalog.pg_attribute WHERE attrelid='public.streams'::regclass AND attname='game_id' AND NOT attisdropped)
 OR EXISTS(SELECT 1 FROM pg_catalog.pg_attribute WHERE attrelid='public.games'::regclass AND attname IN ('canonical_game_id','wikidata_id','igdb_id') AND NOT attisdropped)
 THEN RAISE EXCEPTION 'Feature contracts already or partially installed; compare before reapplying'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_policy WHERE polrelid='public.posts'::regclass AND polname='clipt_post_visibility' AND NOT polpermissive)
 OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_policy WHERE polrelid='public.posts'::regclass AND polname='clipt_post_moderation_visibility' AND NOT polpermissive)
 THEN RAISE EXCEPTION 'Existing post privacy and moderation policies are required'; END IF;
END;
$preflight$;

-- Reviewed source: database/secure_squad_post_visibility.sql
-- Additive, restrictive policy: retain all owner, block, moderation and MFA rules.
-- Existing public types keep their meaning. Squad clips cannot enter the public
-- discovery/ranking/Boost paths, which explicitly allow clipt/clipts/video only.
CREATE POLICY clipt_squad_visibility ON public.posts AS RESTRICTIVE
FOR SELECT TO anon,authenticated USING (
  post_type IS DISTINCT FROM 'squad'
  OR user_id=(SELECT auth.uid())
  OR EXISTS (SELECT 1 FROM public.follows f
    WHERE f.follower_id=(SELECT auth.uid()) AND f.following_id=posts.user_id)
);
CREATE INDEX IF NOT EXISTS clipt_follow_actor_target_idx ON public.follows(follower_id,following_id);
CREATE FUNCTION public.clipt_posting_capabilities() RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL
    AND (SELECT clipt_private.account_available())
    AND (SELECT clipt_private.beta_access_allowed())
    AND EXISTS (SELECT 1 FROM pg_catalog.pg_policy
      WHERE polrelid='public.posts'::regclass AND polname='clipt_squad_visibility'
      AND polpermissive=false AND polcmd='r')
    AND EXISTS (SELECT 1 FROM pg_catalog.pg_class
      WHERE oid='public.posts'::regclass AND relrowsecurity);
$$;
REVOKE ALL ON FUNCTION public.clipt_posting_capabilities() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.clipt_posting_capabilities() TO authenticated;
NOTIFY pgrst,'reload schema';

-- Reviewed source: supabase/migrations/20261016122735_owner_scoped_creator_mutes.sql
-- A private feed preference, not a ban and not a content safety decision.
CREATE TABLE public.user_mutes (
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  muted_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(owner_id,muted_id), CHECK(owner_id<>muted_id)
);
CREATE INDEX user_mutes_target_idx ON public.user_mutes(muted_id);
ALTER TABLE public.user_mutes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_mutes FROM PUBLIC,anon,authenticated;
GRANT SELECT,DELETE ON public.user_mutes TO authenticated;
GRANT INSERT(owner_id,muted_id) ON public.user_mutes TO authenticated;
CREATE POLICY mute_read ON public.user_mutes FOR SELECT TO authenticated
 USING(owner_id=(SELECT auth.uid()) AND (SELECT clipt_private.account_available()));
CREATE POLICY mute_insert ON public.user_mutes FOR INSERT TO authenticated
 WITH CHECK(owner_id=(SELECT auth.uid()) AND (SELECT clipt_private.account_available()));
CREATE POLICY mute_delete ON public.user_mutes FOR DELETE TO authenticated
 USING(owner_id=(SELECT auth.uid()) AND (SELECT clipt_private.account_available()));
INSERT INTO clipt_private.erasure_tables(table_oid,table_name)
 VALUES('public.user_mutes'::regclass::oid,'user_mutes');

-- Reviewed sources: secure_stream_schedules and register_stream_schedule_erasure
-- Reviewed beta announcement contract. Announcements never start OBS, provision a provider,
-- grant LIVE status, or invoke the moderation worker.
CREATE TABLE public.scheduled_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 3 AND 100),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  scheduled_start timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60 CHECK (duration_minutes BETWEEN 15 AND 720),
  is_private boolean NOT NULL DEFAULT true,
  tags text NOT NULL DEFAULT '' CHECK (char_length(tags) <= 100),
  game_id uuid REFERENCES public.games(id) ON DELETE SET NULL,
  -- Reserved compatibility fields cannot be populated by client writes.
  thumbnail_url text CHECK (thumbnail_url IS NULL),
  stream_id uuid CHECK (stream_id IS NULL),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, scheduled_start)
);
CREATE INDEX scheduled_streams_upcoming_idx ON public.scheduled_streams (scheduled_start) WHERE NOT is_private;
CREATE INDEX scheduled_streams_game_idx ON public.scheduled_streams (game_id) WHERE game_id IS NOT NULL;
ALTER TABLE public.scheduled_streams ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.scheduled_streams FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON public.scheduled_streams TO authenticated;
GRANT INSERT (user_id,title,description,scheduled_start,duration_minutes,is_private,tags,game_id)
  ON public.scheduled_streams TO authenticated;
GRANT UPDATE (title,description,scheduled_start,duration_minutes,is_private,tags,game_id)
  ON public.scheduled_streams TO authenticated;

CREATE POLICY schedule_read ON public.scheduled_streams FOR SELECT TO authenticated
  USING ((SELECT clipt_private.account_available()) AND
    (user_id=(SELECT auth.uid()) OR (NOT is_private AND NOT clipt_private.blocked_with(user_id))));
CREATE POLICY schedule_insert ON public.scheduled_streams FOR INSERT TO authenticated
  WITH CHECK ((SELECT clipt_private.account_available()) AND user_id=(SELECT auth.uid()));
CREATE POLICY schedule_update ON public.scheduled_streams FOR UPDATE TO authenticated
  USING ((SELECT clipt_private.account_available()) AND user_id=(SELECT auth.uid()))
  WITH CHECK ((SELECT clipt_private.account_available()) AND user_id=(SELECT auth.uid()));
CREATE POLICY schedule_delete ON public.scheduled_streams FOR DELETE TO authenticated
  USING ((SELECT clipt_private.account_available()) AND user_id=(SELECT auth.uid()));

CREATE FUNCTION clipt_private.validate_stream_schedule() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
  IF NEW.scheduled_start <= now() OR NEW.scheduled_start > now()+interval '1 year' THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Choose a future start within one year';
  END IF;
  -- Serializes concurrent inserts for this owner; the count is owner-visible
  -- through RLS, never a privileged scan of other accounts.
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text, 816));
  IF TG_OP='INSERT' AND (SELECT count(*) FROM public.scheduled_streams
      WHERE user_id=NEW.user_id AND scheduled_start>now()) >= 50 THEN
    RAISE EXCEPTION USING ERRCODE='54000', MESSAGE='Upcoming schedule limit reached';
  END IF;
  NEW.title := btrim(NEW.title);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION clipt_private.validate_stream_schedule() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER validate_stream_schedule BEFORE INSERT OR UPDATE ON public.scheduled_streams
  FOR EACH ROW EXECUTE FUNCTION clipt_private.validate_stream_schedule();

-- Reviewed announcement-only data: no financial/security retention category,
-- provider resources, external delivery, or cross-owner descendants.
-- Register with the existing fail-closed erasure walker; do not weaken it.
INSERT INTO clipt_private.erasure_tables(table_oid,table_name)
VALUES ('public.scheduled_streams'::regclass::oid,'scheduled_streams');

-- New tables must also enforce invitation status for direct/Realtime reads.
CREATE POLICY clipt_beta_access_boundary ON public.user_mutes AS RESTRICTIVE FOR ALL TO anon,authenticated
 USING((SELECT clipt_private.beta_access_allowed())) WITH CHECK((SELECT clipt_private.beta_access_allowed()));
CREATE POLICY clipt_beta_access_boundary ON public.scheduled_streams AS RESTRICTIVE FOR ALL TO anon,authenticated
 USING((SELECT clipt_private.beta_access_allowed())) WITH CHECK((SELECT clipt_private.beta_access_allowed()));

-- Reviewed channel view with explicit optional-moderation dependency handling.
-- Public game tags contain no ingest/provider credentials.
alter table public.streams add column if not exists game_id uuid references public.games(id) on delete set null;
create index if not exists streams_live_game_channel_idx on public.streams(game_id,id) where is_live is true;
grant select(game_id) on public.streams to anon, authenticated;
grant insert(game_id), update(game_id) on public.streams to authenticated;

-- Preserve underlying post/profile RLS; public channels never include private,
-- Squad, future, premium, hidden, or review-held posts.
-- Preserve the installed moderation boundary. Production currently uses
-- moderation_hidden and post RLS, with no Azure review queue. If that optional
-- pipeline is installed, explicitly exclude held records as in development.
-- Refuse a partially installed pipeline rather than treating it as approved.
DO $channel$
DECLARE hold_filter text:='';
BEGIN
 IF to_regprocedure('clipt_private.photo_review_held(uuid)') IS NOT NULL THEN
  hold_filter:=' and not clipt_private.photo_review_held(p.id)';
 ELSIF to_regclass('clipt_private.azure_review_dispatch') IS NOT NULL
    OR to_regclass('clipt_private.azure_dispatch_settings') IS NOT NULL THEN
  RAISE EXCEPTION 'Photo review boundary is incomplete; reconcile before release';
 END IF;
 EXECUTE $definition$create or replace view public.public_channel_posts
with (security_invoker = true, security_barrier = true) as
select p.id,p.content,p.image_url,p.created_at,p.game_id,p.user_id,pr.username,pr.avatar_url
from public.posts p left join public.profiles pr on pr.id=p.user_id
where p.is_published is true and p.moderation_hidden is false
  and p.is_premium is not true and p.is_subscriber_only is not true
  and p.required_tier_id is null and p.post_type is distinct from 'squad'
  and (p.video_url is null or btrim(p.video_url)='')
  and (p.content is not null or p.image_url is not null)
  and p.created_at<=statement_timestamp()$definition$ || hold_filter;
END;
$channel$;
revoke all on public.public_channel_posts from public,anon,authenticated;
grant select on public.public_channel_posts to anon,authenticated;

-- Reviewed sources: canonical_game_catalog and public_game_library
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

NOTIFY pgrst,'reload schema';
COMMIT;

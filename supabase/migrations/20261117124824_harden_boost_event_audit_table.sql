begin;
set local lock_timeout='5s';

-- Viewer ids are never exposed to clients, but indexing this foreign key keeps
-- user erasure/cascade checks bounded as the attribution ledger grows.
create index clipt_boost_events_viewer on public.content_boost_events(viewer_id);

-- Direct table privileges are already revoked. This explicit restrictive
-- policy documents and enforces the deny-by-default contract for client roles,
-- while security-definer RPCs remain the only event write/read surface.
create policy content_boost_events_no_direct_client_access
on public.content_boost_events as restrictive for all to anon,authenticated
using(false) with check(false);

notify pgrst,'reload schema';
commit;

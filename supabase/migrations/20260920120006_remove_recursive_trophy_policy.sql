begin;
-- This permissive policy queries the same RLS relation and compares its post ID
-- with itself. UNIQUE(post_id,user_id) already enforces the intended invariant.
drop policy if exists "Users can vote once per clip" on public.clip_votes;
commit;

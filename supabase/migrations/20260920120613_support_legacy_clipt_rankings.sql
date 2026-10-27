begin;
-- Existing uploads use all three labels. Preserve original rows and votes.
alter policy clipt_vote_eligible_target on public.clip_votes with check (
  user_id = (select auth.uid())
  and coalesce((select auth.jwt()->>'is_anonymous'), 'false') <> 'true'
  and exists (select 1 from public.posts p where p.id = clip_votes.post_id
    and p.is_published is true and p.is_premium is not true
    and p.is_subscriber_only is not true and nullif(p.video_url, '') is not null
    and p.post_type in ('clipt', 'clipts', 'video'))
);
do $migration$
declare definition text;
begin
  definition := pg_get_functiondef('public.get_top_clipts(text)'::regprocedure);
  if position('p.post_type = ''clipt''' in definition) = 0 then
    raise exception 'Unexpected ranking definition; refusing unreviewed rewrite';
  end if;
  execute replace(definition, 'p.post_type = ''clipt''', 'p.post_type in (''clipt'', ''clipts'', ''video'')');
end;
$migration$;
notify pgrst, 'reload schema';
commit;

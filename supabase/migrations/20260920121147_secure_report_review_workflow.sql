begin;
alter table public.posts add column moderation_hidden boolean not null default false;
alter table public.content_reports add column resolution_notes text;

create or replace function clipt_private.protect_post_moderation()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if current_user in ('anon','authenticated') then
    if TG_OP = 'INSERT' then NEW.moderation_hidden := false;
    else NEW.moderation_hidden := OLD.moderation_hidden;
    end if;
  end if;
  return NEW;
end;
$$;
revoke all on function clipt_private.protect_post_moderation() from public, anon, authenticated;
create trigger clipt_protect_post_moderation before insert or update on public.posts
for each row execute function clipt_private.protect_post_moderation();
create policy clipt_post_moderation_visibility on public.posts as restrictive
for select to anon, authenticated
using (not moderation_hidden or user_id = (select auth.uid()));

revoke insert, update, delete, truncate, references, trigger on public.content_reports from public, anon, authenticated;
grant insert (reporter_id,content_id,content_type,reason,notes) on public.content_reports to authenticated;
create policy clipt_report_staff_read on public.content_reports for select to authenticated
using (exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('admin','moderator')));
create policy clipt_report_target on public.content_reports as restrictive for insert to authenticated
with check (
  reporter_id = (select auth.uid())
  and reason in ('inappropriate','harassment','spam','violence','copyright','other')
  and char_length(coalesce(notes,'')) <= 2000
  and ((content_type='post' and exists (select 1 from public.posts p where p.id=content_id))
    or (content_type='comment' and exists (select 1 from public.comments c where c.id=content_id))
    or (content_type='stream' and exists (select 1 from public.streams s where s.id=content_id)))
);

create or replace function clipt_private.limit_report_submission()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if current_user='authenticated' then
    perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 841));
    if (select count(*) from public.content_reports where reporter_id=auth.uid() and created_at>now()-interval '1 minute') >= 5 then
      raise exception 'Please wait before sending another report' using errcode='P0001';
    end if;
    NEW.created_at := statement_timestamp();
    NEW.review_priority := NEW.reason in ('violence','harassment');
  end if;
  return NEW;
end;
$$;
revoke all on function clipt_private.limit_report_submission() from public, anon, authenticated;
create trigger clipt_limit_report_submission before insert on public.content_reports
for each row execute function clipt_private.limit_report_submission();

create or replace function clipt_private.review_content_report(report_id uuid, decision text, moderator_notes text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare report public.content_reports; actor uuid := auth.uid();
begin
  if actor is null or not exists (select 1 from public.user_roles r where r.user_id=actor and r.role in ('admin','moderator')) then
    raise exception 'Moderator role required' using errcode='42501';
  end if;
  if decision is null or decision not in ('dismiss','hide_post') or char_length(coalesce(moderator_notes,''))>2000 then
    raise exception 'Invalid review decision' using errcode='22023';
  end if;
  select * into report from public.content_reports where id=report_id for update;
  if not found then raise exception 'Report not found' using errcode='P0002'; end if;
  if report.status not in ('pending','reviewed') then
    raise exception 'Report already resolved' using errcode='22023';
  end if;
  if decision='hide_post' then
    if report.content_type <> 'post' then raise exception 'Only posts support hiding' using errcode='22023'; end if;
    update public.posts set moderation_hidden=true where id=report.content_id;
    if not found then raise exception 'Reported post no longer exists' using errcode='P0002'; end if;
  end if;
  update public.content_reports set status=case when decision='dismiss' then 'dismissed' else 'resolved' end,
    action_taken=case when decision='dismiss' then 'dismissed' else 'post_hidden' end,
    resolved_by=actor, resolved_at=statement_timestamp(), resolution_notes=nullif(btrim(moderator_notes),'')
    where id=report_id;
  return report_id;
end;
$$;
revoke all on function clipt_private.review_content_report(uuid,text,text) from public, anon, authenticated;
grant execute on function clipt_private.review_content_report(uuid,text,text) to authenticated;
create or replace function public.review_content_report(report_id uuid, decision text, moderator_notes text default '')
returns uuid language sql security invoker set search_path = '' as $$
  select clipt_private.review_content_report(report_id, decision, moderator_notes);
$$;
revoke all on function public.review_content_report(uuid,text,text) from public, anon;
grant execute on function public.review_content_report(uuid,text,text) to authenticated;

-- Owners can inspect their hidden post, but it must never rank publicly.
do $migration$
declare definition text;
begin
  definition := pg_get_functiondef('public.get_top_clipts(text)'::regprocedure);
  if position('where p.is_published is true' in definition)=0 then raise exception 'Unexpected ranking definition'; end if;
  execute replace(definition,'where p.is_published is true','where not p.moderation_hidden and p.is_published is true');
end;
$migration$;
notify pgrst, 'reload schema';
commit;

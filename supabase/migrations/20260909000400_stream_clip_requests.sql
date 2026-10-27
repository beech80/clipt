-- Queue clip processing using the existing batch-processing infrastructure.
create or replace function public.request_stream_clip(
  p_stream_id uuid, p_title text, p_start double precision, p_end double precision, p_request_id uuid
) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); existing public.batch_processing_jobs%rowtype; configuration jsonb; source_id uuid;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_request_id is null or p_title is null or length(trim(p_title)) not between 1 and 100
    or p_start is null or p_end is null or p_start < 0 or p_end <= p_start or p_end-p_start > 60
    or p_end >= 'Infinity'::double precision then raise exception 'Invalid clip parameters'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text,0));
  if not exists(select 1 from public.streams where id=p_stream_id and user_id=actor) then
    raise exception 'Only the stream owner may request a clip' using errcode='42501';
  end if;
  select id into source_id from public.stream_recordings
    where stream_id=p_stream_id and (recording_status in ('ready','completed') or status in ('ready','completed'))
    order by created_at desc limit 1;
  if source_id is null then raise exception 'No processed recording is available'; end if;
  configuration:=jsonb_build_object('stream_id',p_stream_id,'recording_id',source_id,
    'title',trim(p_title),'start_time',p_start,'end_time',p_end);
  select * into existing from public.batch_processing_jobs where id=p_request_id;
  if found then
    if existing.user_id is distinct from actor or existing.settings is distinct from configuration then
      raise exception 'Request ID conflict';
    end if;
    return existing.id;
  end if;
  if (select count(*) from public.batch_processing_jobs where user_id=actor and job_type='stream_clip'
    and created_at>now()-interval '1 hour')>=10 then raise exception 'Clip request limit reached'; end if;
  insert into public.batch_processing_jobs(id,user_id,job_type,status,total_items,processed_items,settings)
    values(p_request_id,actor,'stream_clip','pending',1,0,configuration);
  return p_request_id;
end;
$$;
revoke all on function public.request_stream_clip(uuid,text,double precision,double precision,uuid) from public,anon;
grant execute on function public.request_stream_clip(uuid,text,double precision,double precision,uuid) to authenticated;

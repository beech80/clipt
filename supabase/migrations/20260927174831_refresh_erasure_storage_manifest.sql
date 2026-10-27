begin;
create or replace function clipt_private.account_erasure(p_action text,p_user_id uuid,p_request_id uuid,p_receipt text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare job clipt_private.erasure_jobs%rowtype; fk record; row_data jsonb; mail text; objects jsonb;
begin
 if p_request_id is null or p_receipt !~ '^[a-f0-9]{64}$' or p_receipt is null then raise exception 'Invalid deletion receipt' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(coalesce(p_user_id::text,p_request_id::text),773));
 select * into job from clipt_private.erasure_jobs where id=p_request_id for update;
 if found then
  if job.receipt_hash<>extensions.digest(p_receipt,'sha256') or (p_user_id is not null and job.user_id is not null and job.user_id<>p_user_id) then
   raise exception 'Deletion receipt rejected' using errcode='42501'; end if;
 elsif p_action='begin' and p_user_id is not null then
  if exists(select 1 from clipt_private.erasure_jobs where user_id=p_user_id) then raise exception 'Deletion already requested' using errcode='23505'; end if;
  select email into mail from auth.users where id=p_user_id for update;
  if not found then raise exception 'Account unavailable' using errcode='42501'; end if;
  insert into clipt_private.erasure_jobs(id,user_id,receipt_hash,state) values(p_request_id,p_user_id,extensions.digest(p_receipt,'sha256'),'cleanup') returning * into job;
  insert into clipt_private.erasure_objects select job.id,bucket_id,name from storage.objects where owner_id=p_user_id::text or split_part(name,'/',1)=p_user_id::text;
  create temporary table if not exists erasure_seen(table_oid oid,row_key jsonb,primary key(table_oid,row_key)) on commit drop;
  -- Content-target moderation and auxiliary tables are polymorphic (no FK).
  for row_data in select to_jsonb(r) from public.content_reports r where content_id in (select id from public.posts where user_id=p_user_id union select id from public.streams where user_id=p_user_id) loop
   perform clipt_private.erase_account_row('public.content_reports'::regclass,row_data,job.subject_id);
  end loop;
  delete from public.content_scores where content_id in(select id from public.posts where user_id=p_user_id union select id from public.streams where user_id=p_user_id);
  delete from public.content_performance_predictions where content_id in(select id from public.posts where user_id=p_user_id union select id from public.streams where user_id=p_user_id);
  delete from public.content_similarities where source_id in(select id from public.posts where user_id=p_user_id) or target_id in(select id from public.posts where user_id=p_user_id);
  -- No broad export archive is created; remove only this requesting user's legacy archive.
  delete from public.user_data_archives where user_id=p_user_id;
  delete from public.auth_attempts where email=mail;
  for fk in select c.conrelid table_oid,a.attname col from pg_constraint c
   join pg_namespace n on n.oid=c.connamespace join pg_attribute a on a.attrelid=c.conrelid and a.attnum=c.conkey[1]
   where c.contype='f' and c.confrelid='auth.users'::regclass and n.nspname='public'
   order by (c.conrelid='public.profiles'::regclass) desc
  loop
   for row_data in execute format('select to_jsonb(t) from %s t where %I=$1 for update',fk.table_oid::regclass,fk.col) using p_user_id loop
    perform clipt_private.erase_account_row(fk.table_oid,row_data,job.subject_id);
   end loop;
  end loop;
 else raise exception 'Deletion receipt rejected' using errcode='42501'; end if;
 if job.state='cleanup' then
  insert into clipt_private.erasure_objects select job.id,bucket_id,name from storage.objects
   where owner_id=job.user_id::text or owner::text=job.user_id::text or split_part(name,'/',1)=job.user_id::text
   on conflict do nothing;
 end if;
 if p_action='complete' and job.state<>'complete' then
  if exists(select 1 from auth.users where id=job.user_id) or exists(select 1 from storage.objects o join clipt_private.erasure_objects e on e.bucket_id=o.bucket_id and e.object_name=o.name where e.job_id=job.id) then
   raise exception 'External cleanup not confirmed' using errcode='55000'; end if;
  delete from clipt_private.erasure_objects where job_id=job.id;
  update clipt_private.erasure_jobs set state='complete',completed_at=statement_timestamp(),user_id=null where id=job.id returning * into job;
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('bucket',bucket_id,'path',object_name)),'[]') into objects from clipt_private.erasure_objects where job_id=job.id;
 return jsonb_build_object('state',job.state,'user_id',job.user_id,'objects',objects);
end $$;
commit;

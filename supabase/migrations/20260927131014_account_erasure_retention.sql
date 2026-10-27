begin;
-- No existing account is erased by this migration. All erasure is explicit,
-- owner-authorized through the Edge endpoint, and retryable with a receipt.
create table clipt_private.erasure_policy (
 singleton boolean primary key default true check(singleton),
 financial_years integer not null default 7 check(financial_years between 1 and 100),
 security_years integer not null default 2 check(security_years between 1 and 100)
);
insert into clipt_private.erasure_policy default values;
create table clipt_private.erasure_jobs (
 id uuid primary key, user_id uuid unique, subject_id uuid not null default gen_random_uuid(),
 receipt_hash bytea not null, state text not null check(state in ('cleanup','complete')),
 created_at timestamptz not null default now(), completed_at timestamptz
);
create table clipt_private.erasure_objects (
 job_id uuid references clipt_private.erasure_jobs(id) on delete cascade,
 bucket_id text not null, object_name text not null, primary key(job_id,bucket_id,object_name)
);
create table clipt_private.retained_records (
 id uuid primary key default gen_random_uuid(), subject_id uuid not null,
 category text not null check(category in ('financial','security')),
 source_table text not null, source_id text not null,
 data jsonb not null, retained_at timestamptz not null default now(), expires_at timestamptz not null,
 unique(source_table,source_id)
);
create table clipt_private.retention_holds (
 id uuid primary key default gen_random_uuid(), source_table text not null, source_id text not null,
 reason text not null check(reason in ('dispute','chargeback','fraud','legal')),
 case_reference uuid not null, created_at timestamptz not null default now(), released_at timestamptz,
 retention_until timestamptz
);
-- Frozen schema manifest; future tables need explicit erasure review.
create table clipt_private.erasure_tables (table_oid oid primary key, table_name text not null);
insert into clipt_private.erasure_tables select c.oid,c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind='r';
do $$ declare t text; begin
 foreach t in array array['erasure_policy','erasure_jobs','erasure_objects','retained_records','retention_holds','erasure_tables'] loop
  execute format('alter table clipt_private.%I enable row level security',t);
  execute format('revoke all on clipt_private.%I from public,anon,authenticated',t);
 end loop;
end $$;

create function clipt_private.erase_account_row(p_table oid,p_row jsonb,p_subject uuid,p_depth integer default 0)
returns void language plpgsql security definer set search_path='' as $$
declare fk record; child jsonb; predicate text; pk jsonb; category text; fields text[];
 body jsonb; label text; years integer; stamp timestamptz;
begin
 if p_depth>40 then raise exception 'Erasure dependency depth requires review'; end if;
 select table_name into label from clipt_private.erasure_tables where table_oid=p_table;
 if label is null then raise exception 'Unreviewed erasure table'; end if;
 select jsonb_object_agg(a.attname,p_row->a.attname),
  string_agg(format('%I = %L::%s',a.attname,p_row->>a.attname,format_type(a.atttypid,a.atttypmod)),' and ')
 into pk,predicate from pg_index i join pg_attribute a on a.attrelid=i.indrelid and a.attnum=any(i.indkey)
 where i.indrelid=p_table and i.indisprimary;
 if pk is null or predicate is null then raise exception 'Erasure requires primary key'; end if;
 if exists(select 1 from pg_temp.erasure_seen where table_oid=p_table and row_key=pk) then return; end if;
 insert into pg_temp.erasure_seen values(p_table,pk);
 if (select count(*) from pg_temp.erasure_seen)>10000 then raise exception 'Large erasure requires batched review'; end if;

 -- Shared spaces/provider resources require their own handoff/cancellation;
 -- refuse atomically rather than deleting peers' shared resources.
 if label in ('group_chats','squads','esports_teams','tournaments','mux_assets','mux_uploads','sponsored_streams') then
  raise exception 'External or shared resource requires review' using errcode='P0001';
 end if;
 if label='user_subscriptions' and p_row->>'status' in ('active','trialing','past_due') then
  raise exception 'Active subscription requires provider cancellation' using errcode='P0001';
 end if;
 if label='merchandise_orders' and p_row->>'status' not in ('completed','paid','refunded','cancelled') then
  raise exception 'Open order requires resolution' using errcode='P0001';
 end if;
 if label='streams' and ((p_row->>'is_live')::boolean or nullif(p_row->>'playback_url','') is not null) then
  raise exception 'Provider stream requires shutdown' using errcode='P0001';
 end if;

 category:=case when label in ('token_ledger','token_transactions','content_boosts','stream_gifts','stream_revenue','merchandise_orders','merchandise_order_items','ad_metrics') then 'financial'
  when label in ('security_events','content_reports','stream_violations','chat_timeouts') then 'security' end;
 if category is not null then
  fields:=case when category='financial' then array['id','amount','change_amount','kind','transaction_type','reference_id','transaction_id','currency','fee_amount','payment_status','payment_provider','total_amount','status','quantity','price_at_time','package_code','base_price','discount_percent','token_cost','activated_at','expires_at','created_at','spend','date']
   else array['id','event_type','severity','severity_level','status','content_type','action_taken','violation_type','detection_method','created_at','detected_at','resolved_at','expires_at'] end;
  select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) into body from jsonb_each(p_row) where key=any(fields);
  select case when category='financial' then financial_years else security_years end into years from clipt_private.erasure_policy;
  stamp:=coalesce((p_row->>'created_at')::timestamptz,(p_row->>'activated_at')::timestamptz,(p_row->>'detected_at')::timestamptz,statement_timestamp());
  insert into clipt_private.retained_records(subject_id,category,source_table,source_id,data,expires_at)
  values(p_subject,category,label,coalesce(p_row->>'id',pk::text),body,stamp+make_interval(years=>years)) on conflict(source_table,source_id) do nothing;
 elsif exists(select 1 from clipt_private.retention_holds where source_table=label and source_id=coalesce(p_row->>'id',pk::text) and released_at is null) then
  raise exception 'Held evidence requires scoped review' using errcode='P0001';
 end if;

 -- Descend only referencing rows, never referenced parents/catalogs/users.
 for fk in select c.conrelid child_table,a.attname child_column,b.attname parent_column,
    format_type(a.atttypid,a.atttypmod) child_type,c.confdeltype
  from pg_constraint c join pg_namespace n on n.oid=c.connamespace
  join pg_attribute a on a.attrelid=c.conrelid and a.attnum=c.conkey[1]
  join pg_attribute b on b.attrelid=c.confrelid and b.attnum=c.confkey[1]
  where c.contype='f' and c.confrelid=p_table and n.nspname='public'
 loop
  -- Reply links do not confer ownership of another person's message/comment.
  if fk.child_table in ('public.messages'::regclass,'public.comments'::regclass) and fk.child_column in ('reply_to','parent_id') then
   execute format('update %s set %I=null where %I = %L::%s',fk.child_table::regclass,fk.child_column,fk.child_column,p_row->>fk.parent_column,fk.child_type);
  else
   for child in execute format('select to_jsonb(t) from %s t where %I = %L::%s for update',fk.child_table::regclass,fk.child_column,p_row->>fk.parent_column,fk.child_type) loop
    perform clipt_private.erase_account_row(fk.child_table,child,p_subject,p_depth+1);
   end loop;
  end if;
 end loop;
 execute format('delete from %s where %s',p_table::regclass,predicate);
end $$;

create function clipt_private.account_erasure(p_action text,p_user_id uuid,p_request_id uuid,p_receipt text)
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
 if p_action='complete' and job.state<>'complete' then
  if exists(select 1 from auth.users where id=job.user_id) or exists(select 1 from storage.objects o join clipt_private.erasure_objects e on e.bucket_id=o.bucket_id and e.object_name=o.name where e.job_id=job.id) then
   raise exception 'External cleanup not confirmed' using errcode='55000'; end if;
  delete from clipt_private.erasure_objects where job_id=job.id;
  update clipt_private.erasure_jobs set state='complete',completed_at=statement_timestamp(),user_id=null where id=job.id returning * into job;
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('bucket',bucket_id,'path',object_name)),'[]') into objects from clipt_private.erasure_objects where job_id=job.id;
 return jsonb_build_object('state',job.state,'user_id',job.user_id,'objects',objects);
end $$;
create function public.account_erasure(p_action text,p_user_id uuid,p_request_id uuid,p_receipt text)
returns jsonb language sql security invoker set search_path='' as $$ select clipt_private.account_erasure(p_action,p_user_id,p_request_id,p_receipt) $$;
revoke all on function public.account_erasure(text,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.account_erasure(text,uuid,uuid,text) to service_role;
revoke all on function clipt_private.account_erasure(text,uuid,uuid,text),clipt_private.erase_account_row(oid,jsonb,uuid,integer) from public,anon,authenticated;
grant execute on function clipt_private.account_erasure(text,uuid,uuid,text) to service_role;
-- Disable the legacy archive-and-delete path, including service calls.
revoke all on function public.delete_user_account(uuid) from public,anon,authenticated,service_role;

-- Deleted Auth JWTs can remain cryptographically valid until expiry. Require
-- an extant profile on authenticated Data API operations (no recursion).
create function clipt_private.account_available() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()))
$$;
revoke all on function clipt_private.account_available() from public,anon;
grant execute on function clipt_private.account_available() to authenticated;
do $$ declare t record; begin
 for t in select c.oid,c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relrowsecurity loop
  execute format('create policy clipt_account_must_exist on public.%I as restrictive for all to authenticated using ((select clipt_private.account_available())) with check ((select clipt_private.account_available()))',t.relname);
 end loop;
end $$;
create policy clipt_account_must_exist on storage.objects as restrictive for all to authenticated using ((select clipt_private.account_available())) with check ((select clipt_private.account_available()));

create function clipt_private.purge_expired_retention() returns bigint language plpgsql security definer set search_path='' as $$
declare count_deleted bigint;
begin
 delete from clipt_private.retained_records r where r.expires_at<=statement_timestamp()
  and not exists(select 1 from clipt_private.retention_holds h where h.source_table=r.source_table and h.source_id=r.source_id and (h.released_at is null or h.retention_until>statement_timestamp()));
 get diagnostics count_deleted=row_count;
 delete from clipt_private.retention_holds h where released_at is not null and coalesce(retention_until,released_at)<=statement_timestamp()
  and not exists(select 1 from clipt_private.retained_records r where r.source_table=h.source_table and r.source_id=h.source_id);
 delete from clipt_private.erasure_jobs where state='complete' and completed_at<statement_timestamp()-interval '1 day';
 return count_deleted;
end $$;
revoke all on function clipt_private.purge_expired_retention() from public,anon,authenticated;
commit;

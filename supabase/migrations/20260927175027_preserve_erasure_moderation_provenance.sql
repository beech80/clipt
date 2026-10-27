begin;
-- Attribution is not ownership. Keep peers' moderation state while removing the departing actor.
alter table public.chat_timeouts alter column moderator_id drop not null;
create or replace function clipt_private.erase_account_row(p_table oid,p_row jsonb,p_subject uuid,p_depth integer default 0)
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
  if p_table='public.profiles'::regclass and fk.child_column in ('resolved_by','deleted_by','pinned_by','assigned_by','processed_by') then
   execute format('update %s set %I=null where %I = %L::%s',fk.child_table::regclass,fk.child_column,fk.child_column,p_row->>fk.parent_column,fk.child_type);
  elsif p_table='public.profiles'::regclass and fk.child_table='public.chat_timeouts'::regclass and fk.child_column='moderator_id' then
   execute format('update %s set moderator_id=null where moderator_id=%L::uuid',fk.child_table::regclass,p_row->>'id');
  elsif p_table='public.profiles'::regclass and fk.child_table='public.content_filters'::regclass and fk.child_column='created_by' then
   execute format('update %s set created_by=null where created_by=%L::uuid',fk.child_table::regclass,p_row->>'id');
  elsif fk.child_table in ('public.messages'::regclass,'public.comments'::regclass) and fk.child_column in ('reply_to','parent_id') then
   execute format('update %s set %I=null where %I = %L::%s',fk.child_table::regclass,fk.child_column,fk.child_column,p_row->>fk.parent_column,fk.child_type);
  else
   for child in execute format('select to_jsonb(t) from %s t where %I = %L::%s for update',fk.child_table::regclass,fk.child_column,p_row->>fk.parent_column,fk.child_type) loop
    perform clipt_private.erase_account_row(fk.child_table,child,p_subject,p_depth+1);
   end loop;
  end if;
 end loop;
 execute format('delete from %s where %s',p_table::regclass,predicate);
end $$;

commit;

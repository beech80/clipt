-- Read/sign backup workers only. No client read grants, source writes, net or Vault calls.
create or replace function public.clipt_backup_inventory()
returns jsonb language plpgsql stable security invoker set search_path=pg_catalog,public as $$
declare result jsonb;allowed text[]:=array['avatars','clipt-avatars','media','posts','recordings','videos'];
begin
 if (select count(*) from storage.buckets where id=any(allowed))<>6
 or exists(select 1 from storage.buckets where id=any(allowed) and public)
 or exists(select 1 from storage.objects where bucket_id<>all(allowed))
 or exists(select 1 from storage.objects where archived_at is not null or coalesce(is_delete_marker,false) or coalesce(is_versioned,false))
 then raise exception 'Unsupported private backup source' using errcode='22023';end if;
 if (select count(*) from storage.objects)>1000
 or (select coalesce(sum((metadata->>'size')::bigint),0) from storage.objects)>5000000000
 or exists(select 1 from storage.objects where (metadata->>'size')::bigint>100000000)
 then raise exception 'Private backup safety limit' using errcode='54000';end if;
 select jsonb_build_object('format','clipt-private-media-inventory-v1','project','slnjliheyiiummxhrgmk',
 'capturedAt',statement_timestamp(),'totalBytes',coalesce(sum((o.metadata->>'size')::bigint),0),
 'objects',coalesce(jsonb_agg((to_jsonb(o)-'last_accessed_at')||jsonb_build_object('bucket',o.bucket_id,'public',b.public) order by o.id),'[]'))
 into result from storage.objects o join storage.buckets b on b.id=o.bucket_id where o.bucket_id=any(allowed);
 return result;
end;$$;
create or replace function public.clipt_backup_object(p_id uuid)
returns jsonb language sql stable security invoker set search_path=pg_catalog,public as $$
 select (to_jsonb(o)-'last_accessed_at')||jsonb_build_object('bucket',o.bucket_id,'public',b.public)
 from storage.objects o join storage.buckets b on b.id=o.bucket_id
 where o.id=p_id and o.bucket_id=any(array['avatars','clipt-avatars','media','posts','recordings','videos'])
 and not b.public and o.archived_at is null and not coalesce(o.is_delete_marker,false) and not coalesce(o.is_versioned,false);
$$;
revoke all on function public.clipt_backup_inventory() from public,anon,authenticated;
revoke all on function public.clipt_backup_object(uuid) from public,anon,authenticated;
grant execute on function public.clipt_backup_inventory() to service_role;
grant execute on function public.clipt_backup_object(uuid) to service_role;

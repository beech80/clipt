begin;
do $test$
declare uid uuid; voter uuid; pid uuid:=gen_random_uuid(); snap jsonb; snap2 jsonb; earned_before bigint; notifications_before bigint; rookie uuid;
begin
 select id into uid from public.profiles order by created_at limit 1;
 select id into voter from public.profiles where id<>uid order by created_at limit 1;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',uid,'role','authenticated','aal','aal2')::text,true);
 insert into public.posts(id,user_id,content,video_url,post_type,is_published,is_premium,is_subscriber_only,moderation_hidden)
 values(pid,uid,'Transactional achievement verification','https://akiksrlzdqvipqbbjxpw.supabase.co/storage/v1/object/public/media/'||uid||'/transaction-only.mp4','clipt',true,false,false,false);
 insert into public.clip_votes(post_id,user_id) values(pid,voter);
 snap:=public.sync_my_achievements();
 if (snap->>'trophies')::bigint<>(select count(*) from public.clip_votes v join public.posts p on p.id=v.post_id where p.user_id=uid and p.is_published and p.is_premium is not true and p.is_subscriber_only is not true and p.moderation_hidden is not true and p.created_at<=now() and nullif(p.video_url,'') is not null and p.post_type in ('clipt','clipts','video')) then raise exception 'Trophy count mismatch'; end if;
 select id into rookie from public.achievements where name='Clip Rookie';
 if not exists(select 1 from public.user_achievements where user_id=uid and achievement_id=rookie) then raise exception 'First Trophy milestone not awarded'; end if;
 select count(*) into earned_before from public.user_achievements where user_id=uid;
 select count(*) into notifications_before from public.notifications where user_id=uid;
 snap2:=public.sync_my_achievements();
 if (select count(*) from public.user_achievements where user_id=uid)<>earned_before or
 (select count(*) from public.notifications where user_id=uid)<>notifications_before then raise exception 'Duplicate award or notification'; end if;
 delete from public.clip_votes where post_id=pid;
 snap2:=public.sync_my_achievements();
 if (snap2->>'trophies')::bigint<>(snap->>'trophies')::bigint-1 then raise exception 'Removed Trophy not reflected'; end if;
 if not exists(select 1 from public.user_achievements where user_id=uid and achievement_id=rookie) then raise exception 'Earned milestone was lost'; end if;
 if has_table_privilege('authenticated','public.achievement_progress','UPDATE') or has_function_privilege('anon','public.sync_my_achievements()','EXECUTE') then raise exception 'Unsafe client privileges'; end if;
 perform set_config('request.jwt.claims','{}',true);
 begin perform public.sync_my_achievements(); raise exception 'Anonymous refresh allowed';
 exception when insufficient_privilege then null; end;
end $test$;
select 'PASS: Trophy totals, award, idempotency, removal, retained milestone and access guards' verification;
rollback;
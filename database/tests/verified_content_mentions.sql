begin;
do $$
declare uid uuid; tagged record; pid uuid:=gen_random_uuid(); cid uuid:=gen_random_uuid();
begin
 select id into uid from public.profiles order by created_at limit 1;
 select id,username into tagged from public.profiles where id<>uid and username ~ '^[a-zA-Z0-9_]+$' and not exists(select 1 from public.user_blocks b where b.blocker_id=profiles.id or b.blocked_id=profiles.id) order by created_at limit 1;
 if tagged.id is null then raise exception 'No safe development tag fixture'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',uid,'role','authenticated','aal','aal2')::text,true);
 insert into public.posts(id,user_id,content,video_url,post_type,is_published,is_premium,is_subscriber_only,moderation_hidden)
 values(pid,uid,'Hello @'||tagged.username,'https://akiksrlzdqvipqbbjxpw.supabase.co/storage/v1/object/public/media/'||uid||'/transaction-only.mp4','clipt',true,false,false,false);
 if (select count(*) from public.mentions where post_id=pid and mentioned_user_id=tagged.id)<>1 then raise exception 'Post tag missing'; end if;
 update public.posts set content=content||' @'||tagged.username where id=pid;
 if (select count(*) from public.mentions where post_id=pid)<>1 then raise exception 'Duplicate tag'; end if;
 insert into public.comments(id,user_id,post_id,content) values(cid,uid,pid,'Reply @'||tagged.username);
 if (select count(*) from public.mentions where comment_id=cid and mentioned_user_id=tagged.id)<>1 then raise exception 'Comment tag missing'; end if;
 if (select count(*) from public.notifications where type='mention' and user_id=tagged.id and resource_id=pid and resource_type='post')<>2 then raise exception 'Tag notification does not open post'; end if;
end $$;
select 'PASS: caption tag, duplicate prevention, comment tag and direct-post notifications' verification;
rollback;
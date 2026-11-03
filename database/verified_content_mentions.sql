begin;
create or replace function clipt_private.capture_content_mentions() returns trigger
language plpgsql security definer set search_path='' as $$
declare owner_id uuid; parent_post uuid; is_comment boolean:=tg_table_name='comments';
begin
 owner_id:=new.user_id;if is_comment then parent_post:=new.post_id;else parent_post:=new.id;end if;
 if not exists(select 1 from public.posts p where p.id=parent_post and p.is_published is true
  and p.moderation_hidden is not true and p.is_premium is not true and p.is_subscriber_only is not true
  and p.post_type in ('clipt','clipts','video','photo')) then return new; end if;
 perform pg_advisory_xact_lock(hashtextextended('mentions:'||new.id::text,0));
 insert into public.mentions(mentioned_user_id,mentioning_user_id,post_id,comment_id)
 select p.id,owner_id,case when is_comment then null else parent_post end,case when is_comment then new.id else null end
 from (select distinct lower(m[1]) tag from regexp_matches(coalesce(new.content,''),'(?:^|[[:space:](])@([[:alnum:]_.-]{1,50})','g') m limit 10) tags
 join public.profiles p on lower(p.username)=tags.tag
 where p.id<>owner_id and (select count(*) from public.profiles x where lower(x.username)=tags.tag)=1
 and not exists(select 1 from public.user_blocks b where (b.blocker_id=owner_id and b.blocked_id=p.id) or (b.blocker_id=p.id and b.blocked_id=owner_id))
 and not exists(select 1 from public.mentions existing_mention where existing_mention.mentioned_user_id=p.id and existing_mention.mentioning_user_id=owner_id
  and (case when is_comment then existing_mention.comment_id=new.id else existing_mention.post_id=parent_post and existing_mention.comment_id is null end));
 return new;
end; $$;
revoke all on function clipt_private.capture_content_mentions() from public,anon,authenticated;
create trigger clipt_post_mentions after insert or update of content,is_published on public.posts
 for each row execute function clipt_private.capture_content_mentions();
create trigger clipt_comment_mentions after insert or update of content on public.comments
 for each row execute function clipt_private.capture_content_mentions();
create or replace function public.handle_new_mention() returns trigger
language plpgsql security definer set search_path='' as $$
declare pid uuid;
begin
 pid:=coalesce(new.post_id,(select post_id from public.comments where id=new.comment_id));
 if pid is not null then
 insert into public.notifications(user_id,actor_id,type,content,resource_id,resource_type)
 values(new.mentioned_user_id,new.mentioning_user_id,'mention','mentioned you in a '||case when new.comment_id is null then 'post' else 'comment' end,pid,'post');
 end if;
 return new;
end; $$;
revoke all on function public.handle_new_mention() from public,anon,authenticated;
commit;
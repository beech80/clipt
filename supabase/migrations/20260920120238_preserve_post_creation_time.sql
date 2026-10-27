begin;
create or replace function clipt_private.preserve_post_creation_time()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if TG_OP = 'INSERT' then NEW.created_at := statement_timestamp();
    else NEW.created_at := OLD.created_at;
    end if;
  end if;
  return NEW;
end;
$$;
revoke all on function clipt_private.preserve_post_creation_time() from public, anon, authenticated;
create trigger clipt_preserve_post_creation_time before insert or update on public.posts
for each row execute function clipt_private.preserve_post_creation_time();
commit;

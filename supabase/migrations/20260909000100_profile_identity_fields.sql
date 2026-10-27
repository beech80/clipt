-- Development/staging migration. Requires the reconciled profiles foundation.
-- Do not apply to an existing hosted project without reviewing its schema/data.
alter table public.profiles add column if not exists banner_url text;
alter table public.profiles add column if not exists last_username_change timestamptz;

create or replace function public.enforce_profile_username_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.username is distinct from old.username then
    if old.last_username_change is not null
       and old.last_username_change + interval '2 months' > now() then
      raise exception 'Username can only be changed once every two months'
        using errcode = '23514';
    end if;
    if new.username is null or new.username !~ '^[A-Za-z0-9_]{3,50}$' then
      raise exception 'Username must contain 3-50 letters, numbers, or underscores'
        using errcode = '23514';
    end if;
    new.last_username_change := now();
  else
    new.last_username_change := old.last_username_change;
  end if;
  return new;
end;
$$;

create trigger clipt_profile_username_change
before update on public.profiles
for each row execute function public.enforce_profile_username_change();

create unique index clipt_profiles_username_ci
on public.profiles (lower(username)) where username is not null;

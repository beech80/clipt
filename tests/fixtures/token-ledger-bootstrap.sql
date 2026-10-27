-- Minimal local contract fixture, NOT a production schema or a migration baseline.
create role anon;
create role authenticated;
create role service_role;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema public,auth to anon,authenticated,service_role;
grant execute on function auth.uid() to anon,authenticated,service_role;
create table public.streams (id uuid primary key, user_id uuid references auth.users(id), is_live boolean);
create table public.chat_timeouts (stream_id uuid, user_id uuid, expires_at timestamptz);
create table public.virtual_gifts (id uuid primary key, price numeric not null, is_active boolean);
create table public.stream_gifts (
  id uuid primary key default gen_random_uuid(), stream_id uuid references public.streams(id),
  sender_id uuid references auth.users(id), gift_id uuid references public.virtual_gifts(id),
  amount numeric, quantity integer, message text
);

-- Development migration; requires a validated Supabase baseline before application.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('clipt-avatars', 'clipt-avatars', true, 5242880, array['image/webp'])
on conflict (id) do nothing;

create policy clipt_avatar_read on storage.objects for select
using (bucket_id = 'clipt-avatars');

create policy clipt_avatar_insert on storage.objects for insert to authenticated
with check (bucket_id = 'clipt-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Objects are immutable; replacement uses a fresh random path.
create policy clipt_avatar_delete on storage.objects for delete to authenticated
using (bucket_id = 'clipt-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

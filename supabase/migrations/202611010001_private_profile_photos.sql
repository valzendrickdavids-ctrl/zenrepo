-- Small, private profile images. Existing avatars and other player data are retained.
begin;
create table if not exists public.player_profile_photos (
  user_id uuid primary key references auth.users(id) on delete cascade,
  image_data text not null check (
    char_length(image_data)<=65536 and
    image_data ~ '^data:image/jpeg;base64,[A-Za-z0-9+/]+={0,2}$'
  ),
  updated_at timestamptz not null default now()
);
alter table public.player_profile_photos enable row level security;
revoke all on public.player_profile_photos from public,anon;
grant select,insert,update on public.player_profile_photos to authenticated;
drop policy if exists "profile photo select own" on public.player_profile_photos;
create policy "profile photo select own" on public.player_profile_photos
  for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "profile photo insert own" on public.player_profile_photos;
create policy "profile photo insert own" on public.player_profile_photos
  for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "profile photo update own" on public.player_profile_photos;
create policy "profile photo update own" on public.player_profile_photos
  for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
commit;

-- Run in the Supabase SQL Editor. No project URL or key belongs in this file.
-- Compatible with the earlier Clear & Conquer starter tables.
-- Updated 2026-10-23: private player profiles, optional age/sex, avatars,
-- first-time setup, per-difficulty leaderboards, and owner-only progress reset.
-- Run the entire file. Existing accounts, scores and profile choices are retained.
-- This migration does not enable Facebook OAuth; configure that in Auth Providers.
begin;
create table if not exists public.game_runs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.scores (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null check (score >= 0),
  created_at timestamptz not null default now()
);
alter table public.scores add column if not exists run_id uuid;
-- Legacy scores remain unclassified; never guess their original difficulty.
alter table public.scores add column if not exists difficulty text check (difficulty in ('easy','medium','hard'));
create index if not exists scores_difficulty_rank_idx on public.scores(difficulty,score desc);
create unique index if not exists scores_user_run_unique on public.scores(user_id, run_id);
create index if not exists scores_rank_idx on public.scores(score desc);
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Player'
);
alter table public.game_runs enable row level security;
alter table public.scores enable row level security;
alter table public.profiles enable row level security;

-- Personal details are never exposed through public profile rows or leaderboards.
create table if not exists public.player_private_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Player' check (char_length(display_name) between 1 and 30),
  sex text not null default 'Prefer not to say' check (sex in ('Prefer not to say','Female','Male','Intersex')),
  age integer check (age between 1 and 120),
  avatar text not null default 'owl' check (avatar in ('owl','fox','cat','panda','robot','rocket','facebook')),
  onboarding_complete boolean not null default false
);
alter table public.player_private_profiles enable row level security;
drop policy if exists "private profile select own" on public.player_private_profiles;
create policy "private profile select own" on public.player_private_profiles for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.player_private_profiles from public,anon,authenticated;
grant select on public.player_private_profiles to authenticated;
-- Existing accounts are returning players, even if they have not saved a run.
-- On reruns, preserve every existing onboarding flag and personal detail.
insert into public.player_private_profiles(user_id,display_name,onboarding_complete)
select u.id,coalesce(nullif(left(trim(p.display_name),30),''),
  nullif(left(trim(u.raw_user_meta_data->>'display_name'),30),''),
  nullif(left(trim(u.raw_user_meta_data->>'full_name'),30),''),
  nullif(left(trim(u.raw_user_meta_data->>'name'),30),''),'Player'),true
from auth.users u left join public.profiles p on p.user_id=u.id
on conflict(user_id) do nothing;

create or replace function public.save_player_profile(p_name text,p_sex text,p_age integer,p_avatar text)
returns void language plpgsql security definer set search_path = '' as $$
declare player_id uuid := auth.uid(); clean_name text := coalesce(nullif(trim(p_name),''),'Player');
begin
  if player_id is null then raise exception 'Authentication required'; end if;
  if char_length(clean_name)>30 or p_sex is null or p_sex not in ('Prefer not to say','Female','Male','Intersex')
     or (p_age is not null and (p_age<1 or p_age>120)) or p_avatar is null or p_avatar not in ('owl','fox','cat','panda','robot','rocket','facebook')
     then raise exception 'Invalid profile'; end if;
  insert into public.player_private_profiles(user_id,display_name,sex,age,avatar,onboarding_complete)
    values(player_id,clean_name,p_sex,p_age,p_avatar,true)
    on conflict(user_id) do update set display_name=excluded.display_name,sex=excluded.sex,age=excluded.age,avatar=excluded.avatar,onboarding_complete=true;
  insert into public.profiles(user_id,display_name) values(player_id,clean_name)
    on conflict(user_id) do update set display_name=excluded.display_name;
end;
$$;
revoke all on function public.save_player_profile(text,text,integer,text) from public,anon;
grant execute on function public.save_player_profile(text,text,integer,text) to authenticated;

drop policy if exists "run select own" on public.game_runs;
create policy "run select own" on public.game_runs for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "run insert own" on public.game_runs;
create policy "run insert own" on public.game_runs for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "run update own" on public.game_runs;
create policy "run update own" on public.game_runs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "run delete own" on public.game_runs;
create policy "run delete own" on public.game_runs for delete to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "scores insert own" on public.scores;
create policy "scores insert own" on public.scores for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "scores public select" on public.scores;
create policy "scores public select" on public.scores for select to authenticated using (true);
drop policy if exists "profiles public read" on public.profiles;
create policy "profiles public read" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles own insert" on public.profiles;
create policy "profiles own insert" on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles(user_id, display_name)
  values (new.id, coalesce(nullif(left(trim(new.raw_user_meta_data->>'display_name'),30),''),nullif(left(trim(new.raw_user_meta_data->>'full_name'),30),''),nullif(left(trim(new.raw_user_meta_data->>'name'),30),''),'Player'))
  on conflict (user_id) do nothing;
  insert into public.player_private_profiles(user_id,display_name,onboarding_complete)
  values(new.id,coalesce(nullif(left(trim(new.raw_user_meta_data->>'display_name'),30),''),nullif(left(trim(new.raw_user_meta_data->>'full_name'),30),''),nullif(left(trim(new.raw_user_meta_data->>'name'),30),''),'Player'),false)
  on conflict(user_id) do nothing;
  return new;
end;
$$;
revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_cc on auth.users;
create trigger on_auth_user_created_cc after insert on auth.users
for each row execute function public.create_profile_for_new_user();

-- Include accounts that were created before the profile trigger existed.
insert into public.profiles(user_id, display_name)
select id, coalesce(nullif(left(trim(raw_user_meta_data->>'display_name'),30),''),nullif(left(trim(raw_user_meta_data->>'full_name'),30),''),nullif(left(trim(raw_user_meta_data->>'name'),30),''),'Player')
from auth.users on conflict (user_id) do nothing;

create or replace view public.leaderboard with (security_invoker = true) as
select p.display_name, max(s.score)::integer as best_score
from public.scores s join public.profiles p on p.user_id = s.user_id
group by p.user_id, p.display_name;

create or replace view public.leaderboard_by_difficulty with (security_invoker = true) as
select p.display_name, s.difficulty, max(s.score)::integer as best_score
from public.scores s join public.profiles p on p.user_id = s.user_id
where s.difficulty in ('easy','medium','hard')
group by p.user_id, p.display_name, s.difficulty;
revoke all on public.leaderboard_by_difficulty from public, anon;
grant select on public.leaderboard_by_difficulty to authenticated;

revoke all on public.game_runs, public.scores, public.profiles, public.leaderboard from public, anon;
grant select, insert, update, delete on public.game_runs to authenticated;
grant select, insert on public.scores to authenticated;
grant usage, select on sequence public.scores_id_seq to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.leaderboard to authenticated;
-- Player-requested reset: deletes only the signed-in player's progress and scores.
drop policy if exists "scores delete own" on public.scores;
create policy "scores delete own" on public.scores for delete to authenticated using ((select auth.uid()) = user_id);
grant delete on public.scores to authenticated;
create or replace function public.reset_my_game() returns void
language plpgsql security invoker set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  delete from public.scores where user_id = auth.uid();
  delete from public.game_runs where user_id = auth.uid();
end;
$$;
revoke all on function public.reset_my_game() from public, anon;
grant execute on function public.reset_my_game() to authenticated;
-- Ask Supabase's API to discover the new table, view and profile RPC after commit.
notify pgrst, 'reload schema';
commit;
-- Authenticated players can read score/profile rows. Game saves remain owner-only.
-- Scores are client-submitted for classroom play, not an anti-cheat competition.
-- GOOGLE LOGIN UPDATE: after this base schema, run the companion file
-- supabase/migrations/202610240001_google_login.sql to enable Google avatars
-- and the private, rate-limited login-notification ledger.
-- Then run supabase/migrations/202610240002_usernames.sql for username sign-in.


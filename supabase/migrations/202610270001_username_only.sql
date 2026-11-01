-- Username/password-only account update, 27 October 2026.
-- Apply to the existing game database; account IDs, progress and scores are retained.
begin;
create table if not exists public.player_usernames (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z][a-z0-9_]{2,23}$')
);
alter table public.player_usernames enable row level security;
revoke all on public.player_usernames from public,anon,authenticated;
grant select on public.player_usernames to authenticated;
grant select on public.player_usernames to service_role;
drop policy if exists "read own username" on public.player_usernames;
create policy "read own username" on public.player_usernames for select to authenticated using (user_id=(select auth.uid()));

create or replace function public.set_my_username(p_username text)
returns void language plpgsql security definer set search_path='' as $$
declare name text := lower(trim(p_username));
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if name is null or name !~ '^[a-z][a-z0-9_]{2,23}$' then raise exception 'Invalid username'; end if;
  -- Unique constraints prevent races, duplicate usernames, and username reassignment.
  insert into public.player_usernames(user_id,username) values(auth.uid(),name);
end;
$$;
revoke all on function public.set_my_username(text) from public,anon;
grant execute on function public.set_my_username(text) to authenticated;

create or replace function public.register_player_username()
returns trigger language plpgsql security definer set search_path='' as $$
declare name text := lower(trim(new.raw_user_meta_data->>'username'));
begin
  if name is not null and name<>'' then
    if name !~ '^[a-z][a-z0-9_]{2,23}$' then raise exception 'Invalid username'; end if;
    insert into public.player_usernames(user_id,username) values(new.id,name);
  end if;
  return new;
end;
$$;
revoke all on function public.register_player_username() from public,anon,authenticated;
drop trigger if exists register_player_username on auth.users;
create trigger register_player_username after insert on auth.users for each row execute function public.register_player_username();
-- Existing authenticated accounts may choose a username without changing their user ID.
-- Unique credentials are never derived from public display names.

create table if not exists public.username_login_limits(
  bucket text primary key,
  started_at timestamptz not null,
  attempts integer not null
);
alter table public.username_login_limits enable row level security;
revoke all on public.username_login_limits from public,anon,authenticated;

create or replace function public.allow_username_login(p_name_hash text,p_ip_hash text)
returns boolean language plpgsql security definer set search_path='' as $$
declare key text; hits integer; limit_count integer;
begin
  if p_name_hash !~ '^[a-f0-9]{64}$' or p_ip_hash !~ '^[a-f0-9]{64}$'
    or p_name_hash is null or p_ip_hash is null then return false; end if;
  -- Atomic windows apply even for nonexistent usernames. Global cap also
  -- limits abuse if forwarded address headers cannot be trusted.
  foreach key in array array['global','ip:'||p_ip_hash,'name:'||p_name_hash] loop
    insert into public.username_login_limits(bucket,started_at,attempts) values(key,now(),1)
    on conflict(bucket) do update set
      attempts=case when public.username_login_limits.started_at<now()-interval '15 minutes' then 1 else public.username_login_limits.attempts+1 end,
      started_at=case when public.username_login_limits.started_at<now()-interval '15 minutes' then now() else public.username_login_limits.started_at end
    returning attempts into hits;
    limit_count := case when key='global' then 2000 when key like 'ip:%' then 40 else 8 end;
    if hits>limit_count then return false; end if;
  end loop;
  delete from public.username_login_limits where started_at<now()-interval '1 day';
  return true;
end;
$$;
revoke all on function public.allow_username_login(text,text) from public,anon,authenticated;
grant execute on function public.allow_username_login(text,text) to service_role;


-- Public registration uses its own, tighter server-side request limits.
create or replace function public.allow_username_registration(p_name_hash text,p_ip_hash text)
returns boolean language plpgsql security definer set search_path='' as $$
declare key text; hits integer; limit_count integer;
begin
  if p_name_hash is null or p_ip_hash is null or p_name_hash !~ '^[a-f0-9]{64}$' or p_ip_hash !~ '^[a-f0-9]{64}$' then return false; end if;
  foreach key in array array['signup:global','signup:ip:'||p_ip_hash,'signup:name:'||p_name_hash] loop
    insert into public.username_login_limits(bucket,started_at,attempts) values(key,now(),1)
    on conflict(bucket) do update set
      attempts=case when public.username_login_limits.started_at<now()-interval '1 hour' then 1 else public.username_login_limits.attempts+1 end,
      started_at=case when public.username_login_limits.started_at<now()-interval '1 hour' then now() else public.username_login_limits.started_at end
    returning attempts into hits;
    limit_count:=case when key='signup:global' then 200 when key like 'signup:ip:%' then 10 else 3 end;
    if hits>limit_count then return false; end if;
  end loop;
  delete from public.username_login_limits where started_at<now()-interval '1 day';
  return true;
end;
$$;
revoke all on function public.allow_username_registration(text,text) from public,anon,authenticated;
grant execute on function public.allow_username_registration(text,text) to service_role;

-- Retire provider pictures without changing account IDs, points or saved runs.
do $$
declare item record;
begin
  for item in select conname from pg_constraint where conrelid='public.player_private_profiles'::regclass and contype='c' and pg_get_constraintdef(oid) ilike '%avatar%' loop
    execute format('alter table public.player_private_profiles drop constraint %I',item.conname);
  end loop;
end;
$$;
update public.player_private_profiles set avatar='owl' where avatar not in ('owl','fox','cat','panda','robot','rocket');
alter table public.player_private_profiles add constraint player_private_profiles_avatar_check check(avatar in ('owl','fox','cat','panda','robot','rocket'));
create or replace function public.save_player_profile(p_name text,p_sex text,p_age integer,p_avatar text)
returns void language plpgsql security definer set search_path='' as $$
declare player_id uuid:=auth.uid(); clean_name text:=coalesce(nullif(trim(p_name),''),'Player');
begin
  if player_id is null then raise exception 'Authentication required'; end if;
  if char_length(clean_name)>30 or p_sex is null or p_sex not in ('Prefer not to say','Female','Male','Intersex')
    or (p_age is not null and (p_age<1 or p_age>120)) or p_avatar is null or p_avatar not in ('owl','fox','cat','panda','robot','rocket') then raise exception 'Invalid profile'; end if;
  insert into public.player_private_profiles(user_id,display_name,sex,age,avatar,onboarding_complete)
  values(player_id,clean_name,p_sex,p_age,p_avatar,true)
  on conflict(user_id) do update set display_name=excluded.display_name,sex=excluded.sex,age=excluded.age,avatar=excluded.avatar,onboarding_complete=true;
  insert into public.profiles(user_id,display_name) values(player_id,clean_name)
  on conflict(user_id) do update set display_name=excluded.display_name;
end;
$$;
revoke all on function public.save_player_profile(text,text,integer,text) from public,anon;
grant execute on function public.save_player_profile(text,text,integer,text) to authenticated;
notify pgrst,'reload schema';
commit;

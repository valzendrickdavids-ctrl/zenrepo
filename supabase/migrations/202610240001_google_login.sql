begin;
-- Preserve accounts and progress; only retire the old avatar selection.
alter table public.player_private_profiles
  drop constraint if exists player_private_profiles_avatar_check;
update public.player_private_profiles set avatar='owl' where avatar='facebook';
alter table public.player_private_profiles add constraint player_private_profiles_avatar_check
  check (avatar in ('owl','fox','cat','panda','robot','rocket','google'));

create or replace function public.save_player_profile(p_name text,p_sex text,p_age integer,p_avatar text)
returns void language plpgsql security definer set search_path = '' as $$
declare player_id uuid := auth.uid(); clean_name text := coalesce(nullif(trim(p_name),''),'Player');
begin
  if player_id is null then raise exception 'Authentication required'; end if;
  if char_length(clean_name)>30 or p_sex is null or p_sex not in ('Prefer not to say','Female','Male','Intersex')
     or (p_age is not null and (p_age<1 or p_age>120)) or p_avatar is null
     or p_avatar not in ('owl','fox','cat','panda','robot','rocket','google')
     then raise exception 'Invalid profile'; end if;
  insert into public.player_private_profiles(user_id,display_name,sex,age,avatar,onboarding_complete)
    values(player_id,clean_name,p_sex,p_age,p_avatar,true)
    on conflict(user_id) do update set display_name=excluded.display_name,sex=excluded.sex,
      age=excluded.age,avatar=excluded.avatar,onboarding_complete=true;
  insert into public.profiles(user_id,display_name) values(player_id,clean_name)
    on conflict(user_id) do update set display_name=excluded.display_name;
end;
$$;
revoke all on function public.save_player_profile(text,text,integer,text) from public,anon;
grant execute on function public.save_player_profile(text,text,integer,text) to authenticated;

-- This table never exposes emails or session IDs to browser clients.
create table if not exists public.login_notifications (
  session_id uuid primary key references auth.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  attempts integer not null default 1,
  sent_at timestamptz
);
alter table public.login_notifications enable row level security;
revoke all on public.login_notifications from public,anon,authenticated;
grant select,insert,update on public.login_notifications to service_role;
create index if not exists login_notifications_user_time on public.login_notifications(user_id,claimed_at);

create or replace function public.claim_login_notification(p_user uuid,p_session uuid)
returns timestamptz language plpgsql security definer set search_path='' as $$
declare session_time timestamptz; existing public.login_notifications%rowtype;
begin
  -- Serialize per user to enforce rate limits even across tabs and devices.
  perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
  select created_at into session_time from auth.sessions
    where id=p_session and user_id=p_user;
  if session_time is null or session_time<now()-interval '10 minutes' then return null; end if;
  select * into existing from public.login_notifications where session_id=p_session;
  if found then
    if existing.sent_at is not null or existing.attempts>=3
      or existing.claimed_at>now()-interval '60 seconds' then return null; end if;
    update public.login_notifications set claimed_at=now(),attempts=attempts+1 where session_id=p_session;
  else
    if (select count(*) from public.login_notifications where user_id=p_user
        and claimed_at>now()-interval '1 hour')>=5 then return null; end if;
    insert into public.login_notifications(session_id,user_id) values(p_session,p_user);
  end if;
  return session_time;
end;
$$;
revoke all on function public.claim_login_notification(uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_login_notification(uuid,uuid) to service_role;
commit;

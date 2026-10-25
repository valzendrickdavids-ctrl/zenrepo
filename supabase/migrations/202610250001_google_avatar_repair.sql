begin;
-- Allow Google avatars while preserving existing accounts, progress and avatar choices.
alter table public.player_private_profiles
  drop constraint if exists player_private_profiles_avatar_check;

alter table public.player_private_profiles add constraint player_private_profiles_avatar_check
  check (avatar in ('owl','fox','cat','panda','robot','rocket','facebook','google'));

create or replace function public.save_player_profile(p_name text,p_sex text,p_age integer,p_avatar text)
returns void language plpgsql security definer set search_path = '' as $$
declare player_id uuid := auth.uid(); clean_name text := coalesce(nullif(trim(p_name),''),'Player');
begin
  if player_id is null then raise exception 'Authentication required'; end if;
  if char_length(clean_name)>30 or p_sex is null or p_sex not in ('Prefer not to say','Female','Male','Intersex')
     or (p_age is not null and (p_age<1 or p_age>120)) or p_avatar is null
     or p_avatar not in ('owl','fox','cat','panda','robot','rocket','facebook','google')
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


commit;


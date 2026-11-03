-- Show only the selected avatar/photo next to each ranked player's in-game name.
-- Existing scores, accounts, profile choices and private-table policies are retained.
begin;
create or replace function public.leaderboard_players(p_difficulty text)
returns table(display_name text,best_score integer,avatar text,avatar_image text)
language plpgsql stable security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception using errcode='42501',message='Authentication required'; end if;
  if p_difficulty is null or p_difficulty not in ('easy','medium','hard') then
    raise exception using errcode='22023',message='Invalid difficulty'; end if;
  return query
  with ranked as materialized (
    select s.user_id,p.display_name as name,max(s.score)::integer as points
    from public.scores s join public.profiles p on p.user_id=s.user_id
    where s.difficulty=p_difficulty
    group by s.user_id,p.display_name
    order by max(s.score) desc,p.display_name,s.user_id
    limit 20
  )
  select r.name,r.points,
    case when pp.avatar in ('owl','fox','cat','panda','robot','rocket','dog','tiger','bear','frog','penguin','unicorn') then pp.avatar else 'owl' end,
    case when pp.avatar='rocket' then photo.image_data else null::text end
  from ranked r
  left join public.player_private_profiles pp on pp.user_id=r.user_id
  left join public.player_profile_photos photo on photo.user_id=r.user_id and pp.avatar='rocket'
  order by r.points desc,r.name,r.user_id;
end;
$$;
revoke all on function public.leaderboard_players(text) from public,anon;
grant execute on function public.leaderboard_players(text) to authenticated;

-- Allows the local setup page to confirm this update without signing in as a player.
create or replace function public.leaderboard_profiles_version() returns integer
language sql stable set search_path='' as $$select 1$$;
revoke all on function public.leaderboard_profiles_version() from public;
grant execute on function public.leaderboard_profiles_version() to anon,authenticated;
notify pgrst,'reload schema';
commit;

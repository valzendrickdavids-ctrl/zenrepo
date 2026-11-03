-- Run inside a transaction, then ROLLBACK. Synthetic players only.
create temporary table leaderboard_profile_checks(check_name text);
grant select,insert on leaderboard_profile_checks to authenticated;
create temporary table leaderboard_profile_users(n integer,user_id uuid);
insert into leaderboard_profile_users select n,gen_random_uuid() from generate_series(1,25) n;
insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data)
select user_id,'rankcheck-'||user_id||'@example.invalid','{}','{}' from leaderboard_profile_users;
insert into public.profiles(user_id,display_name)
select user_id,'Player '||lpad(n::text,2,'0') from leaderboard_profile_users on conflict(user_id) do update set display_name=excluded.display_name;
insert into public.player_private_profiles(user_id,display_name,age,sex,avatar)
select user_id,'Player '||lpad(n::text,2,'0'),21,'Male',case when n=1 then 'rocket' when n=2 then 'fox' else 'cat' end
from leaderboard_profile_users on conflict(user_id) do update set avatar=excluded.avatar,age=21,sex='Male';
insert into public.player_profile_photos(user_id,image_data)
select user_id,'data:image/jpeg;base64,/9j/AA==' from leaderboard_profile_users where n in (1,2) on conflict(user_id) do update set image_data=excluded.image_data;
insert into public.scores(user_id,run_id,difficulty,score)
select user_id,gen_random_uuid(),'easy',10000-n*100 from leaderboard_profile_users;
insert into public.scores(user_id,run_id,difficulty,score)
select user_id,gen_random_uuid(),'easy',10000-n*100-50 from leaderboard_profile_users;
insert into public.scores(user_id,run_id,difficulty,score)
select user_id,gen_random_uuid(),'medium',12000-n*100 from leaderboard_profile_users where n<=2;
select set_config('request.jwt.claims',jsonb_build_object('sub',user_id,'role','authenticated')::text,true)
from leaderboard_profile_users where n=25;
set local role authenticated;
do $$
declare data jsonb;first_row jsonb;second_row jsonb;
begin
 select jsonb_agg(to_jsonb(r)) into data from public.leaderboard_players('easy') r;
 if jsonb_array_length(data)<>20 then raise exception 'Expected top 20 players'; end if;
 first_row:=data->0;second_row:=data->1;
 if first_row->>'display_name'<>'Player 01' or first_row->>'best_score'<>'9900' then raise exception 'Rank order or best score incorrect'; end if;
 if first_row->>'avatar'<>'rocket' or first_row->>'avatar_image'<>'data:image/jpeg;base64,/9j/AA==' then raise exception 'Selected photo missing'; end if;
 if second_row->>'avatar'<>'fox' or second_row->'avatar_image'<>'null'::jsonb then raise exception 'Unselected photo exposed'; end if;
 if (select count(*) from jsonb_object_keys(first_row))<>4 or first_row ?| array['user_id','age','sex','email'] then raise exception 'Unexpected profile data exposed'; end if;
 insert into leaderboard_profile_checks values('Top 20, best score once per player, selected avatars/photos, four fields only');
 if (select count(*) from public.leaderboard_players('medium'))<>2 or (select count(*) from public.leaderboard_players('hard'))<>0 then raise exception 'Difficulty separation failed'; end if;
 insert into leaderboard_profile_checks values('Difficulty separation and empty scores');
 if exists(select 1 from public.player_private_profiles where user_id<>auth.uid()) or exists(select 1 from public.player_profile_photos where user_id<>auth.uid()) then raise exception 'Private table access broadened'; end if;
 insert into leaderboard_profile_checks values('Other players private details and direct photos stay restricted');
 begin perform public.leaderboard_players('invalid');raise exception 'Invalid difficulty accepted';exception when invalid_parameter_value then null;end;
 begin perform public.leaderboard_players(null);raise exception 'Missing difficulty accepted';exception when invalid_parameter_value then null;end;
 insert into leaderboard_profile_checks values('Invalid or missing difficulty rejected');
end $$;
reset role;
select set_config('request.jwt.claims','{"role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 begin perform public.leaderboard_players('easy');raise exception 'Missing player session accepted';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $$ begin
 begin perform public.leaderboard_players('easy');raise exception 'Anonymous player list allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
insert into leaderboard_profile_checks values('Signed-in players required; anonymous access blocked');
select count(*) as checks_passed from leaderboard_profile_checks;

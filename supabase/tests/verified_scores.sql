-- Run inside a transaction after the migration, then ROLLBACK. Only temporary
-- synthetic accounts are used; no existing player's rows are changed.
create temporary table score_test_results (check_name text primary key);
grant select,insert on score_test_results to authenticated;
with u as (
 insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data)
 values(gen_random_uuid(),'scorecheck-'||gen_random_uuid()::text||'@example.invalid','{}','{}') returning id
) select set_config('request.jwt.claims',jsonb_build_object('sub',id,'role','authenticated')::text,true) from u;
select set_config('score_test.fixtures',(
 select jsonb_object_agg(mode,jsonb_build_object('order',clues,'answers',answers)) from (
  select difficulty as mode,jsonb_agg(clue_id order by clue_id) as clues,jsonb_agg(answer order by clue_id) as answers
  from game_security.answer_keys group by difficulty
 ) x
)::text,true);
-- Explicit grandfathered fixture, with a server-owned baseline.
insert into game_security.verified_runs(user_id,run_id,difficulty,clue_order,base_index,base_score,base_correct,score,correct)
values(auth.uid(),'aaaaaaaa-0000-4000-8000-000000000001','easy',current_setting('score_test.fixtures')::jsonb->'easy'->'order',3,1500,2,1500,2);
create function pg_temp.expect_score_rejection(payload jsonb) returns void language plpgsql as $$
begin
 begin perform public.submit_verified_score(payload);
 exception when check_violation then return; end;
 raise exception 'A forged score was accepted';
end;
$$;
grant execute on function pg_temp.expect_score_rejection(jsonb) to authenticated;
set local role authenticated;
do $$
declare
 fixtures jsonb:=current_setting('score_test.fixtures')::jsonb;mode text;cap integer;duration integer;
 p jsonb;bad jsonb;answer text;answers jsonb;clues jsonb;events jsonb;res jsonb;n integer;pool integer;before_count integer;
begin
 foreach mode in array array['easy','medium','hard'] loop
  cap:=case mode when 'easy' then 1000 when 'medium' then 1500 else 2000 end;
  duration:=case mode when 'easy' then 60 when 'medium' then 40 else 25 end;
  clues:=fixtures->mode->'order';answers:=fixtures->mode->'answers';answer:=answers->>0;pool:=jsonb_array_length(clues);
  p:=jsonb_build_object('id',gen_random_uuid(),'difficulty',mode,'order',clues,'index',0,'phase','answered','score',cap,'correct',1,
    'scoreAudit',jsonb_build_object('version',1,'baseIndex',0,'baseScore',0,'baseCorrect',0,'events',jsonb_build_array(jsonb_build_object('index',0,'guess',answer,'remaining',duration))));
  res:=public.submit_verified_score(p);
  if res->>'score'<>cap::text or res->'verified'<>'true'::jsonb then raise exception 'Legitimate score failed'; end if;
  select count(*) into before_count from public.scores where user_id=auth.uid();
  perform public.submit_verified_score(p);perform public.submit_verified_score(p);
  if (select count(*) from public.scores where user_id=auth.uid())<>before_count then raise exception 'Duplicate minted another row'; end if;
  insert into score_test_results values(mode||': legitimate score and idempotent retries');

  perform pg_temp.expect_score_rejection(jsonb_set(p,'{score}','9999999'));
  perform pg_temp.expect_score_rejection(jsonb_set(p,'{score}',to_jsonb(cap-1)));
  bad:=jsonb_set(p,'{id}',to_jsonb(gen_random_uuid()));bad:=jsonb_set(bad,'{scoreAudit,events,0,guess}',to_jsonb(lower(answer)||' '));
  perform pg_temp.expect_score_rejection(bad);
  bad:=jsonb_set(p,'{id}',to_jsonb(gen_random_uuid()));bad:=jsonb_set(bad,'{scoreAudit,events,0,remaining}',to_jsonb(duration+1));
  perform pg_temp.expect_score_rejection(bad);
  bad:=jsonb_set(p,'{id}',to_jsonb(gen_random_uuid()));bad:=jsonb_set(bad,'{scoreAudit,events,0,remaining}','-1');
  perform pg_temp.expect_score_rejection(bad);
  bad:=jsonb_set(p,'{id}',to_jsonb(gen_random_uuid()));bad:=jsonb_set(bad,'{scoreAudit,baseScore}',to_jsonb(cap));
  perform pg_temp.expect_score_rejection(bad);
  bad:=jsonb_set(p,'{order,1}',clues->0);perform pg_temp.expect_score_rejection(bad);
  bad:=jsonb_set(p,'{order,0}',clues->1);bad:=jsonb_set(bad,'{order,1}',clues->0);perform pg_temp.expect_score_rejection(bad);
  bad:=jsonb_set(p,'{scoreAudit,events}',(p->'scoreAudit'->'events')||(p->'scoreAudit'->'events'));perform pg_temp.expect_score_rejection(bad);
  insert into score_test_results values(mode||': totals, spelling, timers, baselines, order and duplicate rounds rejected');

  -- Valid append: an incorrect answer costs 100 points, then the next clue times out.
  events:=(p->'scoreAudit'->'events')||jsonb_build_array(jsonb_build_object('index',1,'guess','Wrong answer!','remaining',duration-1),jsonb_build_object('index',1,'guess',null,'remaining',0));
  bad:=jsonb_set(p,'{scoreAudit,events}',events);bad:=jsonb_set(bad,'{score}',to_jsonb(cap-100));bad:=jsonb_set(bad,'{index}','1');
  res:=public.submit_verified_score(bad);
  if res->>'score'<>(cap-100)::text then raise exception 'Penalty or timeout failed'; end if;
  perform public.submit_verified_score(p); -- An older, identical prefix may retry safely.
  bad:=jsonb_set(bad,'{scoreAudit,events,1,guess}','"Rewritten answer"');perform pg_temp.expect_score_rejection(bad);
  bad:=jsonb_set(p,'{id}',to_jsonb(gen_random_uuid()));bad:=jsonb_set(bad,'{scoreAudit,events}',jsonb_build_array(jsonb_build_object('index',0,'guess','Wrong answer!','remaining',duration-1),jsonb_build_object('index',0,'guess',answer,'remaining',duration)));
  perform pg_temp.expect_score_rejection(bad);
  insert into score_test_results values(mode||': penalties, timeouts, immutable history and older retry prefixes');

  -- Millisecond and half-point rounding agrees with the browser's integer formula.
  for n in select unnest(array[1,15,20,23,30001,duration*1000-1]) loop
   if n>duration*1000 then continue; end if;
   bad:=jsonb_set(p,'{id}',to_jsonb(gen_random_uuid()));bad:=jsonb_set(bad,'{scoreAudit,events,0,remaining}',to_jsonb(n::numeric/1000));
   bad:=jsonb_set(bad,'{score}',to_jsonb(greatest(1,(n*cap+duration*500)/(duration*1000))));
   perform public.submit_verified_score(bad);
  end loop;
  insert into score_test_results values(mode||': millisecond scoring and rounding');

  select jsonb_agg(jsonb_build_object('index',ordinality-1,'guess',value,'remaining',duration) order by ordinality) into events from jsonb_array_elements_text(answers) with ordinality;
  bad:=jsonb_set(p,'{id}',to_jsonb(gen_random_uuid()));bad:=jsonb_set(bad,'{scoreAudit,events}',events);
  bad:=jsonb_set(bad,'{score}',to_jsonb(cap*pool));bad:=jsonb_set(bad,'{correct}',to_jsonb(pool));bad:=jsonb_set(bad,'{index}',to_jsonb(pool-1));bad:=jsonb_set(bad,'{phase}','"complete"');
  perform public.submit_verified_score(bad);
  insert into score_test_results values(mode||': complete run and maximum score');
 end loop;

 perform pg_temp.expect_score_rejection(jsonb_build_object('id',gen_random_uuid(),'difficulty','easy','score',500));
 res:=public.submit_verified_score(jsonb_build_object('id','aaaaaaaa-0000-4000-8000-000000000001','difficulty','easy','score',1500));
 if res->>'score'<>'1500' then raise exception 'Legacy baseline failed'; end if;
 p:=jsonb_build_object('id','aaaaaaaa-0000-4000-8000-000000000001','difficulty','easy','order',fixtures->'easy'->'order','index',3,'phase','answered','score',2500,'correct',3,
   'scoreAudit',jsonb_build_object('version',1,'baseIndex',3,'baseScore',1500,'baseCorrect',2,'events',jsonb_build_array(jsonb_build_object('index',3,'guess',fixtures->'easy'->'answers'->>3,'remaining',60))));
 perform public.submit_verified_score(p);
 insert into score_test_results values('Legacy queued snapshot and resumed save keep their frozen baseline');

 begin
  insert into public.scores(user_id,run_id,difficulty,score) values(auth.uid(),gen_random_uuid(),'easy',99999);
  raise exception 'Direct score write was allowed';
 exception when insufficient_privilege then insert into score_test_results values('Direct browser score writes blocked'); end;
 begin perform 1 from game_security.verified_runs;
  raise exception 'Private ledger accessible';
 exception when insufficient_privilege then insert into score_test_results values('Private answer keys and ledgers inaccessible'); end;
 perform public.reset_my_game();
 if exists(select 1 from public.scores where user_id=auth.uid()) then raise exception 'Reset failed'; end if;
 insert into score_test_results values('Player reset still works');
end;
$$;
reset role;
do $$ begin
 if exists(select 1 from game_security.verified_runs where user_id=auth.uid()) then raise exception 'Reset left ledger rows'; end if;
end $$;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $$ begin
 begin perform public.submit_verified_score('{}');raise exception 'Anonymous submission allowed';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
insert into score_test_results values('Anonymous submissions blocked');
select count(*) as checks_passed,'All server-validation checks passed; test data rolled back' as result from score_test_results;

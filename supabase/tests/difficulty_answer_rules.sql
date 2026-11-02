-- Run in a transaction and ROLLBACK. Only synthetic test rows are created.
create temporary table answer_rule_results(check_name text);
grant select,insert on answer_rule_results to authenticated;
with u as (
 insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data)
 values(gen_random_uuid(),'answercheck-'||gen_random_uuid()::text||'@example.invalid','{}','{}') returning id
) select set_config('request.jwt.claims',jsonb_build_object('sub',id,'role','authenticated')::text,true) from u;
select set_config('answer_test.orders',(select jsonb_object_agg(mode,clues) from (
 select difficulty as mode,jsonb_agg(clue_id order by clue_id) as clues from game_security.answer_keys group by difficulty
) x)::text,true);
set local role authenticated;
do $$
declare
 mode text;clues jsonb;first_clue text;official text;duration integer;cap integer;partial text;
 p jsonb;older jsonb;res jsonb;events jsonb;unknown jsonb;
begin
 foreach mode in array array['easy','medium','hard'] loop
  duration:=case mode when 'easy' then 60 when 'medium' then 40 else 25 end;
  cap:=case mode when 'easy' then 1000 when 'medium' then 1500 else 2000 end;
  first_clue:=case mode when 'easy' then 'hard-drive' when 'medium' then 'virtual-machine' else 'breadth-first-search' end;
  official:=case mode when 'easy' then 'Hard drive' when 'medium' then 'Virtual machine' else 'Breadth-first search' end;
  partial:=case mode when 'easy' then '  HDD  ' when 'medium' then 'Machine' else official end;
  select jsonb_build_array(first_clue)||jsonb_agg(value order by value) into clues
  from jsonb_array_elements_text(current_setting('answer_test.orders')::jsonb->mode) where value<>first_clue;
  events:=jsonb_build_array(jsonb_build_object('index',0,'guess','Wrong answer!','remaining',duration,'rulesVersion',2),
    jsonb_build_object('index',0,'guess',partial,'remaining',duration,'rulesVersion',2));
  p:=jsonb_build_object('id',gen_random_uuid(),'difficulty',mode,'order',clues,'index',0,'phase','answered','score',cap,'correct',1,
    'scoreAudit',jsonb_build_object('version',1,'baseIndex',0,'baseScore',0,'baseCorrect',0,'events',events));
  res:=public.submit_verified_score(p);
  if res->>'score'<>cap::text then raise exception 'New rules did not accept the answer: %',mode; end if;
  perform public.submit_verified_score(p);
  insert into answer_rule_results values(mode||': matching and no deduction, idempotent retry');
  unknown:=jsonb_set(jsonb_set(p,'{id}',to_jsonb(gen_random_uuid())),'{scoreAudit,events,0,rulesVersion}','3');
  begin perform public.submit_verified_score(unknown);raise exception 'Unknown rules accepted';
  exception when check_violation then null;end;

  -- A wrong new answer after earning points leaves the total unchanged.
  p:=jsonb_set(p,'{scoreAudit,events}',events||jsonb_build_array(jsonb_build_object('index',1,'guess','Wrong answer!','remaining',duration-1,'rulesVersion',2)));
  p:=jsonb_set(p,'{phase}','"playing"');p:=jsonb_set(p,'{index}','1');
  res:=public.submit_verified_score(p);
  if res->>'score'<>cap::text then raise exception 'Wrong answer deducted points'; end if;
  insert into answer_rule_results values(mode||': wrong answers preserve earned points');

  -- Preserve an old run's confirmed history, append a new no-penalty event.
  events:=jsonb_build_array(jsonb_build_object('index',0,'guess',official,'remaining',duration),
    jsonb_build_object('index',1,'guess','Old wrong answer','remaining',duration));
  older:=jsonb_set(jsonb_set(p,'{id}',to_jsonb(gen_random_uuid())),'{scoreAudit,events}',events);
  older:=jsonb_set(older,'{score}',to_jsonb(cap-100));perform public.submit_verified_score(older);
  older:=jsonb_set(older,'{scoreAudit,events}',events||jsonb_build_array(jsonb_build_object('index',1,'guess','New wrong answer','remaining',duration-1,'rulesVersion',2)));
  res:=public.submit_verified_score(older);
  if res->>'score'<>(cap-100)::text then raise exception 'Existing history changed'; end if;
  insert into answer_rule_results values(mode||': old runs resume with new rules without rewriting scores');
 end loop;
end $$;
reset role;
select count(*) as checks_passed from answer_rule_results;

begin;
create table if not exists public.player_feedback (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 category text not null check(category in ('Bug report','Suggestion','Other')),
 message text not null check(char_length(message) between 10 and 2000),
 created_at timestamptz not null default now()
);
alter table public.player_feedback enable row level security;
revoke all on public.player_feedback from public,anon,authenticated;
grant select on public.player_feedback to authenticated;
grant select on public.player_feedback to service_role;
drop policy if exists "read own feedback" on public.player_feedback;
create policy "read own feedback" on public.player_feedback for select to authenticated using(user_id=(select auth.uid()));
create index if not exists player_feedback_user_time on public.player_feedback(user_id,created_at);
create or replace function public.submit_player_feedback(p_category text,p_message text)
returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); clean text:=trim(p_message);
begin
 if uid is null then raise exception 'Authentication required'; end if;
 if p_category is null or p_category not in ('Bug report','Suggestion','Other') or clean is null or char_length(clean) not between 10 and 2000 then raise exception 'Invalid feedback'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text||':feedback',0));
 if (select count(*) from public.player_feedback where user_id=uid and created_at>now()-interval '1 hour')>=5 then raise exception 'Feedback limit reached'; end if;
 insert into public.player_feedback(user_id,category,message) values(uid,p_category,clean);
end;
$$;
revoke all on function public.submit_player_feedback(text,text) from public,anon;
grant execute on function public.submit_player_feedback(text,text) to authenticated;
notify pgrst,'reload schema';
commit;

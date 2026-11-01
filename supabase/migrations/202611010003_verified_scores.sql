-- New uploads are replayed against official answers. Existing scores are retained.
begin;
create schema if not exists game_security;
revoke all on schema game_security from public,anon,authenticated;
create table if not exists game_security.answer_keys (
  clue_id text primary key,difficulty text not null,answer text not null
);
insert into game_security.answer_keys(clue_id,difficulty,answer) values
('keyboard','easy','Keyboard'),
('mouse','easy','Mouse'),
('monitor','easy','Monitor'),
('cpu','easy','CPU'),
('ram','easy','RAM'),
('hard-drive','easy','Hard drive'),
('usb-drive','easy','USB flash drive'),
('router','easy','Router'),
('ethernet','easy','Ethernet cable'),
('server','easy','Server'),
('printer','easy','Printer'),
('webcam','easy','Webcam'),
('database','easy','Database'),
('firewall','easy','Firewall'),
('cloud','easy','Cloud computing'),
('binary','easy','Binary'),
('flowchart','easy','Flowchart'),
('motherboard','easy','Motherboard'),
('laptop','easy','Laptop'),
('tablet','easy','Tablet'),
('smartphone','easy','Smartphone'),
('headphones','easy','Headphones'),
('microphone','easy','Microphone'),
('speaker','easy','Speaker'),
('digital-camera','easy','Digital camera'),
('scanner','easy','Scanner'),
('gamepad','easy','Gamepad'),
('joystick','easy','Joystick'),
('projector','easy','Projector'),
('optical-disc','easy','Optical disc'),
('memory-card','easy','Memory card'),
('battery','easy','Battery'),
('power-plug','easy','Power plug'),
('cooling-fan','easy','Cooling fan'),
('power-button','easy','Power button'),
('ethernet-port','easy','Ethernet port'),
('wifi','easy','Wi-Fi'),
('bluetooth','easy','Bluetooth'),
('satellite-dish','easy','Satellite dish'),
('cell-tower','easy','Cell tower'),
('computer-network','easy','Computer network'),
('world-wide-web','easy','World Wide Web'),
('email','easy','Email'),
('chat','easy','Chat'),
('video-call','easy','Video call'),
('search','easy','Search'),
('folder','easy','Folder'),
('file','easy','File'),
('text-document','easy','Text document'),
('image-file','easy','Image file'),
('video-file','easy','Video file'),
('audio-file','easy','Audio file'),
('archive-file','easy','Archive file'),
('recycle-bin','easy','Recycle bin'),
('download','easy','Download'),
('upload','easy','Upload'),
('save','easy','Save'),
('copy','easy','Copy'),
('cut','easy','Cut'),
('clipboard','easy','Clipboard'),
('undo','easy','Undo'),
('redo','easy','Redo'),
('zoom-in','easy','Zoom in'),
('zoom-out','easy','Zoom out'),
('lock','easy','Lock'),
('key','easy','Key'),
('security-shield','easy','Security shield'),
('fingerprint','easy','Fingerprint'),
('hide-password','easy','Hide password'),
('qr-code','easy','QR code'),
('barcode','easy','Barcode'),
('location-pin','easy','Location pin'),
('calendar','easy','Calendar'),
('clock','easy','Clock'),
('calculator','easy','Calculator'),
('presentation','easy','Presentation'),
('spreadsheet','easy','Spreadsheet'),
('bar-chart','easy','Bar chart'),
('paintbrush','easy','Paintbrush'),
('pencil-tool','easy','Pencil tool'),
('color-palette','easy','Color palette'),
('crop-tool','easy','Crop tool'),
('settings','easy','Settings'),
('terminal','easy','Terminal'),
('source-code','easy','Source code'),
('software-bug','easy','Software bug'),
('curly-braces','easy','Curly braces'),
('square-brackets','easy','Square brackets'),
('hyperlink','easy','Hyperlink'),
('bookmark','easy','Bookmark'),
('notification','easy','Notification'),
('user-account','easy','User account'),
('user-group','easy','User group'),
('contacts','easy','Contacts'),
('refresh','easy','Refresh'),
('help','easy','Help'),
('information','easy','Information'),
('sign-in','easy','Sign in'),
('sign-out','easy','Sign out'),
('shutdown','easy','Shutdown'),
('html','medium','HTML'),
('css','medium','CSS'),
('javascript','medium','JavaScript'),
('python','medium','Python'),
('sql','medium','SQL'),
('json','medium','JSON'),
('xml','medium','XML'),
('csv','medium','CSV'),
('boolean','medium','Boolean'),
('variable','medium','Variable'),
('array','medium','Array'),
('object','medium','Object'),
('function','medium','Function'),
('loop','medium','Loop'),
('conditional','medium','Conditional'),
('recursion','medium','Recursion'),
('stack','medium','Stack'),
('queue','medium','Queue'),
('linked-list','medium','Linked list'),
('binary-tree','medium','Binary tree'),
('hash-table','medium','Hash table'),
('algorithm','medium','Algorithm'),
('sorting','medium','Sorting'),
('linear-search','medium','Linear search'),
('binary-search','medium','Binary search'),
('star-topology','medium','Star topology'),
('bus-topology','medium','Bus topology'),
('ring-topology','medium','Ring topology'),
('mesh-topology','medium','Mesh topology'),
('ip-address','medium','IP address'),
('dns','medium','DNS'),
('dhcp','medium','DHCP'),
('tcp','medium','TCP'),
('udp','medium','UDP'),
('http','medium','HTTP'),
('https','medium','HTTPS'),
('url','medium','URL'),
('vpn','medium','VPN'),
('proxy','medium','Proxy server'),
('load-balancer','medium','Load balancer'),
('network-switch','medium','Network switch'),
('access-point','medium','Access point'),
('subnet-mask','medium','Subnet mask'),
('network-port','medium','Network port'),
('packet','medium','Packet'),
('client-server','medium','Client-server architecture'),
('peer-to-peer','medium','Peer-to-peer'),
('cache','medium','Cache'),
('cookie','medium','Cookie'),
('session','medium','Session'),
('password-hashing','medium','Password hashing'),
('encryption','medium','Encryption'),
('phishing','medium','Phishing'),
('malware','medium','Malware'),
('ransomware','medium','Ransomware'),
('mfa','medium','Multi-factor authentication'),
('backup','medium','Backup'),
('version-control','medium','Version control'),
('git-branch','medium','Git branch'),
('git-merge','medium','Git merge'),
('git-commit','medium','Git commit'),
('unit-test','medium','Unit test'),
('debugger','medium','Debugger'),
('exception','medium','Exception'),
('api','medium','API'),
('rest','medium','REST'),
('crud','medium','CRUD'),
('primary-key','medium','Primary key'),
('foreign-key','medium','Foreign key'),
('database-index','medium','Database index'),
('transaction','medium','Transaction'),
('normalization','medium','Normalization'),
('container','medium','Container'),
('virtual-machine','medium','Virtual machine'),
('operating-system','medium','Operating system'),
('b-tree','hard','B-tree'),
('red-black-tree','hard','Red-black tree'),
('avl-tree','hard','AVL tree'),
('binary-heap','hard','Binary heap'),
('trie','hard','Trie'),
('breadth-first-search','hard','Breadth-first search'),
('depth-first-search','hard','Depth-first search'),
('dijkstra','hard','Dijkstra''s algorithm'),
('a-star','hard','A-star search'),
('quicksort','hard','Quicksort'),
('merge-sort','hard','Merge sort'),
('dynamic-programming','hard','Dynamic programming'),
('memoization','hard','Memoization'),
('big-o','hard','Big O notation'),
('race-condition','hard','Race condition'),
('deadlock','hard','Deadlock'),
('mutex','hard','Mutex'),
('semaphore','hard','Semaphore'),
('thread-pool','hard','Thread pool'),
('event-loop','hard','Event loop'),
('promise','hard','Promise'),
('closure','hard','Closure'),
('prototype','hard','Prototype'),
('polymorphism','hard','Polymorphism'),
('dependency-injection','hard','Dependency injection'),
('observer-pattern','hard','Observer pattern'),
('singleton-pattern','hard','Singleton pattern'),
('factory-pattern','hard','Factory pattern'),
('cap-theorem','hard','CAP theorem'),
('acid','hard','ACID'),
('mvcc','hard','MVCC'),
('optimistic-concurrency','hard','Optimistic concurrency control'),
('pessimistic-locking','hard','Pessimistic locking'),
('two-phase-commit','hard','Two-phase commit'),
('raft','hard','Raft consensus'),
('eventual-consistency','hard','Eventual consistency'),
('sharding','hard','Sharding'),
('replication','hard','Replication'),
('write-ahead-log','hard','Write-ahead log'),
('query-plan','hard','Query execution plan'),
('sql-injection','hard','SQL injection'),
('xss','hard','Cross-site scripting'),
('csrf','hard','Cross-site request forgery'),
('jwt','hard','JSON Web Token'),
('public-key-cryptography','hard','Public-key cryptography'),
('digital-signature','hard','Digital signature'),
('tls-handshake','hard','TLS handshake'),
('zero-knowledge-proof','hard','Zero-knowledge proof'),
('merkle-tree','hard','Merkle tree'),
('bloom-filter','hard','Bloom filter')
on conflict(clue_id) do update set difficulty=excluded.difficulty,answer=excluded.answer;
create table if not exists game_security.verified_runs (
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null,difficulty text not null,clue_order jsonb not null,
  base_index integer not null default 0,base_score integer not null default 0,
  base_correct integer not null default 0,events jsonb not null default '[]',
  score integer not null default 0,correct integer not null default 0,
  updated_at timestamptz not null default now(),primary key(user_id,run_id)
);
create table if not exists game_security.applied_rules (version integer primary key);
alter table game_security.answer_keys enable row level security;
alter table game_security.verified_runs enable row level security;
alter table game_security.applied_rules enable row level security;
revoke all on all tables in schema game_security from public,anon,authenticated;

-- Freeze compatible saves once, before accepting new submissions. A later edit
-- to game_runs can never create or raise a grandfathered starting score.
do $$
begin
  if not exists(select 1 from game_security.applied_rules where version=1) then
    with candidates as materialized (
      select g.user_id,r from public.game_runs g cross join lateral (
        select g.state as r union all
        select value from jsonb_each(case when jsonb_typeof(g.state->'savedRuns')='object' then g.state->'savedRuns' else '{}'::jsonb end)
      ) saves
      where r->>'id' ~ '^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$'
        and r->>'difficulty' in ('easy','medium','hard') and r->>'phase' in ('playing','answered','complete')
        and r->>'index' ~ '^[0-9]{1,3}$' and r->>'score' ~ '^[0-9]{1,7}$' and r->>'correct' ~ '^[0-9]{1,3}$'
        and jsonb_typeof(r->'order')='array'
    )
    insert into game_security.verified_runs(user_id,run_id,difficulty,clue_order,base_index,base_score,base_correct,score,correct)
    select g.user_id,(r->>'id')::uuid,r->>'difficulty',r->'order',
      case when r->>'phase'='complete' then jsonb_array_length(r->'order') else (r->>'index')::integer+case when r->>'phase'='answered' then 1 else 0 end end,
      (r->>'score')::integer,(r->>'correct')::integer,(r->>'score')::integer,(r->>'correct')::integer
    from candidates g
    where jsonb_array_length(r->'order')=case r->>'difficulty' when 'easy' then 100 when 'medium' then 75 else 50 end
      and (r->>'index')::integer < jsonb_array_length(r->'order')
      and (r->>'correct')::integer <= (r->>'index')::integer+case when r->>'phase' in ('answered','complete') then 1 else 0 end
      and (r->>'score')::integer <= (r->>'correct')::integer*case r->>'difficulty' when 'easy' then 1000 when 'medium' then 1500 else 2000 end
      and (select count(distinct k.clue_id) from jsonb_array_elements_text(r->'order') x join game_security.answer_keys k on k.clue_id=x.value and k.difficulty=r->>'difficulty')=jsonb_array_length(r->'order')
    on conflict(user_id,run_id) do nothing;
    insert into game_security.applied_rules values(1);
  end if;
end;
$$;

alter table public.scores add column if not exists verified boolean not null default false;
-- SELECT and the player's existing DELETE/reset access are unchanged.
revoke insert,update on public.scores from public,anon,authenticated;
drop policy if exists "scores insert own" on public.scores;
drop policy if exists "scores require verification" on public.scores;
create policy "scores require verification" on public.scores as restrictive for insert to authenticated with check(false);

create or replace function public.submit_verified_score(p_run jsonb) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  uid uuid:=auth.uid(); rid uuid; mode text; duration integer; cap integer; pool integer;
  ledger game_security.verified_runs%rowtype;
  audit jsonb; history jsonb; item jsonb; incoming_order jsonb; ordinal integer;
  calculated integer; correct_count integer; seconds numeric; previous_seconds numeric;
  expected text; guess text; event_count integer; shared integer; n integer; snapshot uuid;
begin
  if uid is null then raise exception using errcode='42501',message='Authentication required'; end if;
  if jsonb_typeof(p_run) is distinct from 'object' or octet_length(p_run::text)>1048576
    or jsonb_typeof(p_run->'id') is distinct from 'string'
    or (p_run->>'id') !~ '^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$'
    or jsonb_typeof(p_run->'score') is distinct from 'number' or (p_run->>'score') !~ '^[0-9]{1,7}$'
  then raise exception using errcode='23514',message='Invalid score submission'; end if;
  rid:=(p_run->>'id')::uuid;mode:=p_run->>'difficulty';
  case mode when 'easy' then duration:=60;cap:=1000;pool:=100;
    when 'medium' then duration:=40;cap:=1500;pool:=75;
    when 'hard' then duration:=25;cap:=2000;pool:=50;
    else raise exception using errcode='23514',message='Invalid difficulty'; end case;
  if (p_run->>'score')::integer>cap*pool then raise exception using errcode='23514',message='Impossible score'; end if;

  audit:=p_run->'scoreAudit';incoming_order:=p_run->'order';
  if audit is null and incoming_order is null then
    -- Compatibility for already queued, pre-upgrade snapshots. No new points
    -- can be awarded without an answer history.
    select * into ledger from game_security.verified_runs where user_id=uid and run_id=rid for update;
    if not found or ledger.difficulty<>mode or ledger.base_score<>(p_run->>'score')::integer then
      raise exception using errcode='23514',message='Saved run predates score verification'; end if;
    calculated:=ledger.base_score;correct_count:=ledger.base_correct;
  else
    if jsonb_typeof(incoming_order) is distinct from 'array' or jsonb_array_length(incoming_order)<>pool then
      raise exception using errcode='23514',message='Invalid clue order'; end if;
    if (select count(distinct k.clue_id) from jsonb_array_elements_text(incoming_order) x join game_security.answer_keys k on k.clue_id=x.value and k.difficulty=mode)<>pool then
      raise exception using errcode='23514',message='Duplicate or wrong-difficulty clues'; end if;
    if jsonb_typeof(audit) is distinct from 'object' or audit->'version' is distinct from '1'::jsonb
      or jsonb_typeof(audit->'events') is distinct from 'array'
      or jsonb_typeof(audit->'baseIndex') is distinct from 'number' or (audit->>'baseIndex') !~ '^[0-9]{1,3}$'
      or jsonb_typeof(audit->'baseScore') is distinct from 'number' or (audit->>'baseScore') !~ '^[0-9]{1,7}$'
      or jsonb_typeof(audit->'baseCorrect') is distinct from 'number' or (audit->>'baseCorrect') !~ '^[0-9]{1,3}$'
      or jsonb_typeof(p_run->'correct') is distinct from 'number' or (p_run->>'correct') !~ '^[0-9]{1,3}$'
    then raise exception using errcode='23514',message='Missing or invalid answer history'; end if;
    history:=audit->'events';event_count:=jsonb_array_length(history);
    if event_count>5000 then raise exception using errcode='23514',message='Answer history too large'; end if;
    -- A new ledger always starts at zero; a browser cannot manufacture a baseline.
    insert into game_security.verified_runs(user_id,run_id,difficulty,clue_order)
      values(uid,rid,mode,incoming_order) on conflict(user_id,run_id) do nothing;
    select * into ledger from game_security.verified_runs where user_id=uid and run_id=rid for update;
    if ledger.difficulty<>mode or ledger.clue_order<>incoming_order
      or ledger.base_index<>(audit->>'baseIndex')::integer or ledger.base_score<>(audit->>'baseScore')::integer
      or ledger.base_correct<>(audit->>'baseCorrect')::integer then
      raise exception using errcode='23514',message='Run identity or baseline changed'; end if;
    shared:=least(jsonb_array_length(ledger.events),event_count);
    if shared>0 then
      for n in 0..shared-1 loop
        if ledger.events->n is distinct from history->n then
          raise exception using errcode='23514',message='Previously submitted answers cannot be rewritten'; end if;
      end loop;
    end if;
    ordinal:=ledger.base_index;calculated:=ledger.base_score;correct_count:=ledger.base_correct;previous_seconds:=duration;
    for item in select value from jsonb_array_elements(history) loop
      if jsonb_typeof(item) is distinct from 'object' or jsonb_typeof(item->'index') is distinct from 'number'
        or item->>'index' is distinct from ordinal::text or ordinal>=pool
        or jsonb_typeof(item->'remaining') is distinct from 'number' or length(item->>'remaining')>30
      then raise exception using errcode='23514',message='Invalid or repeated round'; end if;
      seconds:=(item->>'remaining')::numeric;
      if seconds<0 or seconds>duration or seconds>previous_seconds or seconds*1000<>trunc(seconds*1000) then
        raise exception using errcode='23514',message='Invalid round timer'; end if;
      if item->'guess'='null'::jsonb and seconds=0 then
        ordinal:=ordinal+1;previous_seconds:=duration;
      else
        if jsonb_typeof(item->'guess') is distinct from 'string' or length(item->>'guess') not between 1 and 100 or seconds<=0 then
          raise exception using errcode='23514',message='Invalid answer'; end if;
        guess:=item->>'guess';
        select answer into expected from game_security.answer_keys where clue_id=incoming_order->>ordinal and difficulty=mode;
        if guess collate "C" = expected collate "C" then
          calculated:=calculated+greatest(1,floor(cap*seconds/duration+0.5)::integer);
          correct_count:=correct_count+1;ordinal:=ordinal+1;previous_seconds:=duration;
        else calculated:=greatest(0,calculated-100);previous_seconds:=seconds;
        end if;
      end if;
    end loop;
    if calculated<>(p_run->>'score')::integer or correct_count<>(p_run->>'correct')::integer
      or (case p_run->>'phase' when 'playing' then ordinal when 'answered' then ordinal-1 when 'complete' then pool-1 else -1 end)::text is distinct from p_run->>'index'
      or (p_run->>'phase'='complete' and ordinal<>pool)
      or (p_run->>'phase'='playing' and ordinal>=pool)
    then raise exception using errcode='23514',message='Score does not match the answer history'; end if;
    if event_count>=jsonb_array_length(ledger.events) then
      update game_security.verified_runs set events=history,score=calculated,correct=correct_count,updated_at=now() where user_id=uid and run_id=rid;
    end if;
  end if;
  -- Snapshot identity is generated here. Retries can never mint extra points.
  snapshot:=md5(rid::text||':'||mode||':'||calculated::text||':verified')::uuid;
  insert into public.scores(user_id,run_id,difficulty,score,verified) values(uid,snapshot,mode,calculated,true)
    on conflict(user_id,run_id) do nothing;
  return jsonb_build_object('score',calculated,'correct',correct_count,'verified',true);
end;
$$;
revoke all on function public.submit_verified_score(jsonb) from public,anon;
grant execute on function public.submit_verified_score(jsonb) to authenticated;

-- Reset clears only the requesting player's rows, including the private ledger.
create or replace function public.reset_my_game() returns void
language plpgsql security definer set search_path=''
as $$
declare uid uuid:=auth.uid();
begin
  if uid is null then raise exception using errcode='42501',message='Authentication required'; end if;
  delete from public.scores where user_id=uid;
  delete from public.game_runs where user_id=uid;
  delete from game_security.verified_runs where user_id=uid;
end;
$$;
revoke all on function public.reset_my_game() from public,anon;
grant execute on function public.reset_my_game() to authenticated;
notify pgrst,'reload schema';
commit;

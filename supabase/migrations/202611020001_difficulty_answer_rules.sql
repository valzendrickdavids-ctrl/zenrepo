-- Difficulty-specific answer rules. Naming conventions remain case-sensitive.
-- Existing scores, accounts, saves and immutable answer histories are preserved.
begin;
alter table game_security.answer_keys add column if not exists accepted_names text[] not null default '{}';
alter table game_security.answer_keys add column if not exists blocked_abbreviations text[] not null default '{}';
update game_security.answer_keys k set accepted_names=v.names,blocked_abbreviations=v.blocked
from (values
('keyboard',array['Keyboard','Computer keyboard']::text[],array[]::text[]),
('mouse',array['Mouse','Computer mouse']::text[],array[]::text[]),
('monitor',array['Monitor','Display','Computer screen']::text[],array[]::text[]),
('cpu',array['CPU','Processor','Central processing unit']::text[],array[]::text[]),
('ram',array['RAM','Random access memory','Memory']::text[],array[]::text[]),
('hard-drive',array['Hard drive','Hard disk','HDD','Hard disk drive']::text[],array[]::text[]),
('usb-drive',array['USB flash drive','Flash drive','USB drive','Thumb drive']::text[],array[]::text[]),
('router',array['Router','WiFi router','Wireless router']::text[],array[]::text[]),
('ethernet',array['Ethernet cable','Network cable','LAN cable','RJ45']::text[],array[]::text[]),
('server',array['Server','Server rack','Rack server']::text[],array[]::text[]),
('printer',array['Printer','Computer printer']::text[],array[]::text[]),
('webcam',array['Webcam','Web camera']::text[],array[]::text[]),
('database',array['Database','Relational database']::text[],array[]::text[]),
('firewall',array['Firewall','Network firewall']::text[],array[]::text[]),
('cloud',array['Cloud computing','Cloud','Cloud storage']::text[],array[]::text[]),
('binary',array['Binary','Binary code','Base 2']::text[],array[]::text[]),
('flowchart',array['Flowchart','Flow chart']::text[],array[]::text[]),
('motherboard',array['Motherboard','Mainboard','System board']::text[],array[]::text[]),
('laptop',array['Laptop','Notebook computer','Notebook']::text[],array[]::text[]),
('tablet',array['Tablet','Tablet computer']::text[],array[]::text[]),
('smartphone',array['Smartphone','Mobile phone','Cellphone']::text[],array[]::text[]),
('headphones',array['Headphones','Headset']::text[],array[]::text[]),
('microphone',array['Microphone','Mic']::text[],array[]::text[]),
('speaker',array['Speaker','Loudspeaker']::text[],array[]::text[]),
('digital-camera',array['Digital camera','Camera']::text[],array[]::text[]),
('scanner',array['Scanner','Document scanner']::text[],array[]::text[]),
('gamepad',array['Gamepad','Game controller','Controller']::text[],array[]::text[]),
('joystick',array['Joystick','Flight stick']::text[],array[]::text[]),
('projector',array['Projector','Video projector']::text[],array[]::text[]),
('optical-disc',array['Optical disc','CD','DVD','Disc']::text[],array[]::text[]),
('memory-card',array['Memory card','SD card','Flash card']::text[],array[]::text[]),
('battery',array['Battery','Rechargeable battery']::text[],array[]::text[]),
('power-plug',array['Power plug','Plug','Electrical plug']::text[],array[]::text[]),
('cooling-fan',array['Cooling fan','Fan','Computer fan']::text[],array[]::text[]),
('power-button',array['Power button','Power switch']::text[],array[]::text[]),
('ethernet-port',array['Ethernet port','Network port','LAN port']::text[],array[]::text[]),
('wifi',array['Wi-Fi','WiFi','Wireless network']::text[],array[]::text[]),
('bluetooth',array['Bluetooth','Bluetooth wireless']::text[],array[]::text[]),
('satellite-dish',array['Satellite dish','Satellite antenna']::text[],array[]::text[]),
('cell-tower',array['Cell tower','Radio tower','Mobile tower']::text[],array[]::text[]),
('computer-network',array['Computer network','Network']::text[],array[]::text[]),
('world-wide-web',array['World Wide Web','Web','WWW']::text[],array[]::text[]),
('email',array['Email','E-mail','Electronic mail']::text[],array[]::text[]),
('chat',array['Chat','Instant messaging','Message']::text[],array[]::text[]),
('video-call',array['Video call','Video conference','Video chat']::text[],array[]::text[]),
('search',array['Search','Search tool','Magnifying glass']::text[],array[]::text[]),
('folder',array['Folder','Directory']::text[],array[]::text[]),
('file',array['File','Computer file']::text[],array[]::text[]),
('text-document',array['Text document','Text file','Document']::text[],array[]::text[]),
('image-file',array['Image file','Picture file','Image']::text[],array[]::text[]),
('video-file',array['Video file','Movie file','Video']::text[],array[]::text[]),
('audio-file',array['Audio file','Sound file','Audio']::text[],array[]::text[]),
('archive-file',array['Archive file','Zip file','Compressed archive']::text[],array[]::text[]),
('recycle-bin',array['Recycle bin','Trash','Trash bin']::text[],array[]::text[]),
('download',array['Download','Downloading']::text[],array[]::text[]),
('upload',array['Upload','Uploading']::text[],array[]::text[]),
('save',array['Save','Save file']::text[],array[]::text[]),
('copy',array['Copy','Copy command']::text[],array[]::text[]),
('cut',array['Cut','Cut command']::text[],array[]::text[]),
('clipboard',array['Clipboard','Pasteboard']::text[],array[]::text[]),
('undo',array['Undo','Undo command']::text[],array[]::text[]),
('redo',array['Redo','Redo command']::text[],array[]::text[]),
('zoom-in',array['Zoom in','Magnify']::text[],array[]::text[]),
('zoom-out',array['Zoom out','Reduce zoom']::text[],array[]::text[]),
('lock',array['Lock','Padlock']::text[],array[]::text[]),
('key',array['Key','Access key']::text[],array[]::text[]),
('security-shield',array['Security shield','Shield','Protection']::text[],array[]::text[]),
('fingerprint',array['Fingerprint','Biometric fingerprint']::text[],array[]::text[]),
('hide-password',array['Hide password','Hide','Hidden password']::text[],array[]::text[]),
('qr-code',array['QR code','Quick response code']::text[],array[]::text[]),
('barcode',array['Barcode','Bar code']::text[],array[]::text[]),
('location-pin',array['Location pin','Map pin','Location marker']::text[],array[]::text[]),
('calendar',array['Calendar','Digital calendar']::text[],array[]::text[]),
('clock',array['Clock','Digital clock']::text[],array[]::text[]),
('calculator',array['Calculator','Calculator app']::text[],array[]::text[]),
('presentation',array['Presentation','Slide presentation','Slideshow']::text[],array[]::text[]),
('spreadsheet',array['Spreadsheet','Worksheet']::text[],array[]::text[]),
('bar-chart',array['Bar chart','Column chart','Bar graph']::text[],array[]::text[]),
('paintbrush',array['Paintbrush','Brush tool']::text[],array[]::text[]),
('pencil-tool',array['Pencil tool','Pencil','Edit tool']::text[],array[]::text[]),
('color-palette',array['Color palette','Palette']::text[],array[]::text[]),
('crop-tool',array['Crop tool','Crop']::text[],array[]::text[]),
('settings',array['Settings','Preferences','Gear']::text[],array[]::text[]),
('terminal',array['Terminal','Command line','Console']::text[],array[]::text[]),
('source-code',array['Source code','Code','Program code']::text[],array[]::text[]),
('software-bug',array['Software bug','Bug']::text[],array[]::text[]),
('curly-braces',array['Curly braces','Braces']::text[],array[]::text[]),
('square-brackets',array['Square brackets','Brackets']::text[],array[]::text[]),
('hyperlink',array['Hyperlink','Link']::text[],array[]::text[]),
('bookmark',array['Bookmark','Web bookmark']::text[],array[]::text[]),
('notification',array['Notification','Alert','Notification bell']::text[],array[]::text[]),
('user-account',array['User account','User','Account']::text[],array[]::text[]),
('user-group',array['User group','Group','Multiple users']::text[],array[]::text[]),
('contacts',array['Contacts','Address book','Contact card']::text[],array[]::text[]),
('refresh',array['Refresh','Reload']::text[],array[]::text[]),
('help',array['Help','Help button']::text[],array[]::text[]),
('information',array['Information','Info']::text[],array[]::text[]),
('sign-in',array['Sign in','Login','Log in']::text[],array[]::text[]),
('sign-out',array['Sign out','Logout','Log out']::text[],array[]::text[]),
('shutdown',array['Shutdown','Power off']::text[],array[]::text[]),
('html',array['HTML','Hypertext markup language']::text[],array[]::text[]),
('css',array['CSS','Cascading style sheets']::text[],array[]::text[]),
('javascript',array['JavaScript']::text[],array['JS']::text[]),
('python',array['Python','Python language']::text[],array[]::text[]),
('sql',array['SQL','Structured query language']::text[],array[]::text[]),
('json',array['JSON','JavaScript object notation']::text[],array[]::text[]),
('xml',array['XML','Extensible markup language']::text[],array[]::text[]),
('csv',array['CSV','Comma separated values']::text[],array[]::text[]),
('boolean',array['Boolean','Boolean value']::text[],array['Bool']::text[]),
('variable',array['Variable','Program variable']::text[],array[]::text[]),
('array',array['Array','List','Indexed array']::text[],array[]::text[]),
('object',array['Object','Dictionary','Record']::text[],array[]::text[]),
('function',array['Function','Procedure','Subroutine']::text[],array[]::text[]),
('loop',array['Loop','Iteration','For loop']::text[],array[]::text[]),
('conditional',array['Conditional','If statement','If else']::text[],array[]::text[]),
('recursion',array['Recursion','Recursive function']::text[],array[]::text[]),
('stack',array['Stack','Last in first out']::text[],array['LIFO']::text[]),
('queue',array['Queue','First in first out']::text[],array['FIFO']::text[]),
('linked-list',array['Linked list','Singly linked list']::text[],array[]::text[]),
('binary-tree',array['Binary tree','Binary tree structure']::text[],array[]::text[]),
('hash-table',array['Hash table','Hash map','Hashmap']::text[],array[]::text[]),
('algorithm',array['Algorithm','Procedure steps']::text[],array[]::text[]),
('sorting',array['Sorting','Sort','Ascending sort']::text[],array[]::text[]),
('linear-search',array['Linear search','Sequential search']::text[],array[]::text[]),
('binary-search',array['Binary search','Halving search']::text[],array[]::text[]),
('star-topology',array['Star topology','Star network']::text[],array[]::text[]),
('bus-topology',array['Bus topology','Bus network']::text[],array[]::text[]),
('ring-topology',array['Ring topology','Ring network']::text[],array[]::text[]),
('mesh-topology',array['Mesh topology','Mesh network']::text[],array[]::text[]),
('ip-address',array['IP address','Internet protocol address']::text[],array['IPv4']::text[]),
('dns',array['DNS','Domain name system']::text[],array[]::text[]),
('dhcp',array['DHCP','Dynamic host configuration protocol']::text[],array[]::text[]),
('tcp',array['TCP','Transmission control protocol']::text[],array[]::text[]),
('udp',array['UDP','User datagram protocol']::text[],array[]::text[]),
('http',array['HTTP','Hypertext transfer protocol']::text[],array[]::text[]),
('https',array['HTTPS','HTTP secure']::text[],array[]::text[]),
('url',array['URL','Uniform resource locator']::text[],array[]::text[]),
('vpn',array['VPN','Virtual private network']::text[],array[]::text[]),
('proxy',array['Proxy server','Proxy']::text[],array[]::text[]),
('load-balancer',array['Load balancer','Load balancing']::text[],array[]::text[]),
('network-switch',array['Network switch','Switch','Ethernet switch']::text[],array[]::text[]),
('access-point',array['Access point','Wireless access point','WiFi access point']::text[],array[]::text[]),
('subnet-mask',array['Subnet mask','Netmask']::text[],array[]::text[]),
('network-port',array['Network port','Port number','Port']::text[],array[]::text[]),
('packet',array['Packet','Network packet','Data packet']::text[],array[]::text[]),
('client-server',array['Client-server architecture','Client server']::text[],array[]::text[]),
('peer-to-peer',array['Peer-to-peer','Peer to peer network']::text[],array['P2P']::text[]),
('cache',array['Cache','Caching']::text[],array[]::text[]),
('cookie',array['Cookie','HTTP cookie','Browser cookie']::text[],array[]::text[]),
('session',array['Session','Web session','User session']::text[],array[]::text[]),
('password-hashing',array['Password hashing','Password hash']::text[],array[]::text[]),
('encryption',array['Encryption','Data encryption']::text[],array[]::text[]),
('phishing',array['Phishing','Phishing attack']::text[],array[]::text[]),
('malware',array['Malware','Malicious software']::text[],array[]::text[]),
('ransomware',array['Ransomware','Ransomware attack']::text[],array[]::text[]),
('mfa',array['Multi-factor authentication','Two factor authentication']::text[],array['MFA','2FA']::text[]),
('backup',array['Backup','Data backup']::text[],array[]::text[]),
('version-control',array['Version control','Source control']::text[],array['VCS']::text[]),
('git-branch',array['Git branch','Branch','Branching']::text[],array[]::text[]),
('git-merge',array['Git merge','Merge','Merging']::text[],array[]::text[]),
('git-commit',array['Git commit','Commit']::text[],array[]::text[]),
('unit-test',array['Unit test','Unit testing']::text[],array[]::text[]),
('debugger',array['Debugger','Debugging tool']::text[],array[]::text[]),
('exception',array['Exception','Error handling','Try catch']::text[],array[]::text[]),
('api',array['API','Application programming interface']::text[],array[]::text[]),
('rest',array['REST','Representational state transfer']::text[],array[]::text[]),
('crud',array['CRUD','Create read update delete']::text[],array[]::text[]),
('primary-key',array['Primary key']::text[],array['PK']::text[]),
('foreign-key',array['Foreign key']::text[],array['FK']::text[]),
('database-index',array['Database index','Index']::text[],array[]::text[]),
('transaction',array['Transaction','Database transaction']::text[],array[]::text[]),
('normalization',array['Normalization','Database normalization']::text[],array[]::text[]),
('container',array['Container','Software container','Docker container']::text[],array[]::text[]),
('virtual-machine',array['Virtual machine']::text[],array['VM']::text[]),
('operating-system',array['Operating system']::text[],array['OS']::text[]),
('b-tree',array['B-tree','Btree','B tree']::text[],array[]::text[]),
('red-black-tree',array['Red-black tree','Red black tree']::text[],array[]::text[]),
('avl-tree',array['AVL tree','Avl']::text[],array[]::text[]),
('binary-heap',array['Binary heap','Min heap','Heap']::text[],array[]::text[]),
('trie',array['Trie','Prefix tree']::text[],array[]::text[]),
('breadth-first-search',array['Breadth-first search','Bfs','Breadth first search']::text[],array[]::text[]),
('depth-first-search',array['Depth-first search','Dfs','Depth first search']::text[],array[]::text[]),
('dijkstra',array['Dijkstra''s algorithm','Dijkstra','Dijkstra algorithm']::text[],array[]::text[]),
('a-star',array['A-star search','A star','A*','Astar']::text[],array[]::text[]),
('quicksort',array['Quicksort','Quick sort']::text[],array[]::text[]),
('merge-sort',array['Merge sort','Mergesort']::text[],array[]::text[]),
('dynamic-programming',array['Dynamic programming','Dp']::text[],array[]::text[]),
('memoization',array['Memoization','Memoisation']::text[],array[]::text[]),
('big-o',array['Big O notation','Big o','Asymptotic complexity']::text[],array[]::text[]),
('race-condition',array['Race condition','Data race']::text[],array[]::text[]),
('deadlock',array['Deadlock','Circular wait']::text[],array[]::text[]),
('mutex',array['Mutex','Mutual exclusion lock']::text[],array[]::text[]),
('semaphore',array['Semaphore','Counting semaphore']::text[],array[]::text[]),
('thread-pool',array['Thread pool','Worker pool']::text[],array[]::text[]),
('event-loop',array['Event loop','JavaScript event loop']::text[],array[]::text[]),
('promise',array['Promise','JavaScript promise']::text[],array[]::text[]),
('closure',array['Closure','Lexical closure']::text[],array[]::text[]),
('prototype',array['Prototype','Prototype chain','Prototypal inheritance']::text[],array[]::text[]),
('polymorphism',array['Polymorphism','Subtype polymorphism']::text[],array[]::text[]),
('dependency-injection',array['Dependency injection','Di']::text[],array[]::text[]),
('observer-pattern',array['Observer pattern','Publish subscribe','Pub sub']::text[],array[]::text[]),
('singleton-pattern',array['Singleton pattern','Singleton']::text[],array[]::text[]),
('factory-pattern',array['Factory pattern','Factory method','Factory']::text[],array[]::text[]),
('cap-theorem',array['CAP theorem','Cap']::text[],array[]::text[]),
('acid',array['ACID','Atomicity consistency isolation durability']::text[],array[]::text[]),
('mvcc',array['MVCC','Multiversion concurrency control']::text[],array[]::text[]),
('optimistic-concurrency',array['Optimistic concurrency control','Optimistic locking']::text[],array[]::text[]),
('pessimistic-locking',array['Pessimistic locking','Pessimistic concurrency control']::text[],array[]::text[]),
('two-phase-commit',array['Two-phase commit','2pc','Two phase commit']::text[],array[]::text[]),
('raft',array['Raft consensus','Raft']::text[],array[]::text[]),
('eventual-consistency',array['Eventual consistency','Eventually consistent']::text[],array[]::text[]),
('sharding',array['Sharding','Database sharding']::text[],array[]::text[]),
('replication',array['Replication','Data replication']::text[],array[]::text[]),
('write-ahead-log',array['Write-ahead log','Wal','Write ahead logging']::text[],array[]::text[]),
('query-plan',array['Query execution plan','Query plan','Execution plan']::text[],array[]::text[]),
('sql-injection',array['SQL injection','Sqli']::text[],array[]::text[]),
('xss',array['Cross-site scripting','Xss','Cross site scripting']::text[],array[]::text[]),
('csrf',array['Cross-site request forgery','Csrf','Cross site request forgery']::text[],array[]::text[]),
('jwt',array['JSON Web Token','Jwt']::text[],array[]::text[]),
('public-key-cryptography',array['Public-key cryptography','Asymmetric cryptography','Asymmetric encryption']::text[],array[]::text[]),
('digital-signature',array['Digital signature','Signature']::text[],array[]::text[]),
('tls-handshake',array['TLS handshake','Transport layer security handshake']::text[],array[]::text[]),
('zero-knowledge-proof',array['Zero-knowledge proof','Zkp','Zero knowledge']::text[],array[]::text[]),
('merkle-tree',array['Merkle tree','Hash tree']::text[],array[]::text[]),
('bloom-filter',array['Bloom filter','Bloomfilter']::text[],array[]::text[])
) as v(clue_id,names,blocked) where k.clue_id=v.clue_id;

create or replace function game_security.answer_matches(p_clue text,p_guess text,p_version integer)
returns boolean language plpgsql stable set search_path='' as $$
declare
  key game_security.answer_keys%rowtype; input text; candidate text; fragment text;
  start integer; word_count integer; initials text;
begin
  if p_guess is null then return false; end if;
  select * into key from game_security.answer_keys where clue_id=p_clue;
  if not found then return false; end if;
  if p_version=1 or key.difficulty='hard' then return p_guess collate "C" = key.answer collate "C"; end if;
  if p_version<>2 then return false; end if;
  input:=btrim(regexp_replace(p_guess,U&'[\0009-\000D\0020\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]+',' ','g'));
  if input='' or (key.difficulty='medium' and input collate "C" <> p_guess collate "C") then return false; end if;
  if key.difficulty='medium' and input=any(key.blocked_abbreviations) then return false; end if;
  foreach candidate in array key.accepted_names loop
    if input collate "C" = candidate collate "C" then return true; end if;
    if length(regexp_replace(input,'[^A-Za-z0-9]','','g'))>=3 then
      for start in 1..length(candidate) loop
        fragment:=substr(candidate,start,length(input));
        if left(fragment,1)~'^[a-z]$' then fragment:=upper(left(fragment,1))||substr(fragment,2); end if;
        if length(fragment)=length(input) and input collate "C" = fragment collate "C" then return true; end if;
      end loop;
    end if;
    if key.difficulty='easy' then
      select count(*),upper(string_agg(left(parts[1],1),'')) into word_count,initials
      from regexp_matches(candidate,'[A-Za-z0-9]+','g') as t(parts);
      if word_count>1 and input collate "C" = initials collate "C" then return true; end if;
    end if;
  end loop;
  return false;
end;
$$;
revoke all on function game_security.answer_matches(text,text,integer) from public,anon,authenticated;

create or replace function public.submit_verified_score(p_run jsonb) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  uid uuid:=auth.uid(); rid uuid; mode text; duration integer; cap integer; pool integer;
  ledger game_security.verified_runs%rowtype;
  audit jsonb; history jsonb; item jsonb; incoming_order jsonb; ordinal integer;
  calculated integer; correct_count integer; seconds numeric; previous_seconds numeric;
  expected text; guess text; rules_version integer; event_count integer; shared integer; n integer; snapshot uuid;
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
      if item ? 'rulesVersion' and item->'rulesVersion' is distinct from '2'::jsonb then
        raise exception using errcode='23514',message='Unknown answer rules'; end if;
      rules_version:=case when item ? 'rulesVersion' then 2 else 1 end;
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
        if game_security.answer_matches(incoming_order->>ordinal,guess,rules_version) then
          calculated:=calculated+greatest(1,floor(cap*seconds/duration+0.5)::integer);
          correct_count:=correct_count+1;ordinal:=ordinal+1;previous_seconds:=duration;
        else
          -- Old history keeps its original result; new wrong guesses cost no points.
          if rules_version=1 then calculated:=greatest(0,calculated-100); end if;
          previous_seconds:=seconds;
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


insert into game_security.applied_rules(version) values(2) on conflict do nothing;
create or replace function public.game_answer_rules_version() returns integer
language sql stable set search_path='' as $$select 2$$;
grant execute on function public.game_answer_rules_version() to anon,authenticated;
notify pgrst,'reload schema';
commit;

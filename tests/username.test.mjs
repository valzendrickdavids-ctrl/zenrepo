import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeUsername,signInWithUsername} from '../src/lib/username.js';
import {makeUsernameHandler} from '../supabase/functions/username-login/handler.js';
const origin='https://game.example.org';
const req=(body,other={})=>new Request(origin,{method:'POST',headers:{Origin:origin},body:JSON.stringify(body),...other});
test('usernames are case insensitive and reject emails, spaces and unsafe names',()=>{
 assert.equal(normalizeUsername(' Player_21 '),'player_21');
 for(const value of ['ab','1player','a b','player@example.org','a'.repeat(25),'a<script>'])assert.throws(()=>normalizeUsername(value));
});
test('username client exchanges only session tokens, not email lookup data',async()=>{
 let supplied,session;
 const client={functions:{invoke:async(name,args)=>{
  assert.equal(name,'username-login');supplied=args.body;
  return {data:{session:{access_token:'access',refresh_token:'refresh'}}};
 }},auth:{setSession:async input=>{session=input;return {data:{session:{}},error:null};}}};
 await signInWithUsername(client,'Player_21','password');
 assert.deepEqual(supplied,{username:'player_21',password:'password'});
 assert.deepEqual(session,{access_token:'access',refresh_token:'refresh'});
});
function fixture(overrides={}) {
 const calls=[];
 const handle=makeUsernameHandler({allowedOrigins:[origin],
 allowAttempt:async name=>{calls.push(['limit',name]);return true;},
 findEmail:async name=>{calls.push(['lookup',name]);return 'private@example.org';},
 signIn:async(email,password)=>{calls.push(['password',email,password]);return {data:{session:{access_token:'access',refresh_token:'refresh',user:{email}}}};},
 ...overrides});
 return {handle,calls};
}
test('endpoint authenticates password and does not return the resolved email',async()=>{
 const f=fixture();
 const response=await f.handle(req({username:'Player_21',password:'password',email:'attacker@example.org'}));
 assert.equal(response.status,200);
 assert.deepEqual(await response.json(),{session:{access_token:'access',refresh_token:'refresh'}});
 assert.deepEqual(f.calls,[['limit','player_21'],['lookup','player_21'],['password','private@example.org','password']]);
 assert.equal(response.headers.get('Cache-Control'),'no-store');
});
test('unknown username and wrong password have identical errors',async()=>{
 const missing=fixture({findEmail:async()=>null,signIn:async()=>({error:{}})});
 const wrong=fixture({signIn:async()=>({error:{message:'private upstream response'}})});
 const body={username:'player',password:'wrong'};
 const a=await missing.handle(req(body)),b=await wrong.handle(req(body));
 assert.equal(a.status,b.status);assert.deepEqual(await a.json(),await b.json());
});
test('rate limiting prevents lookup and password attempts',async()=>{
 const f=fixture({allowAttempt:async()=>false});
 assert.equal((await f.handle(req({username:'player',password:'wrong'}))).status,429);
 assert.equal(f.calls.length,0);
});
test('malformed input and wrong origins cannot trigger a login',async()=>{
 const f=fixture();
 for(const body of [{username:'x',password:'p'},{username:'player',password:12},{username:'player',password:'a'.repeat(1025)}])
 assert.equal((await f.handle(req(body))).status,400);
 assert.equal((await f.handle(req({username:'player',password:'p'},{headers:{Origin:'https://evil.example'}}))).status,403);
 assert.equal(f.calls.length,0);
});

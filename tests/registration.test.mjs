import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRegistrationHandler} from '../supabase/functions/username-register/handler.js';
import {registerWithUsername,validatePassword} from '../src/lib/username.js';

const origin='https://game.example.org';
const request=(body,options={})=>new Request(origin,{method:'POST',headers:{Origin:origin},body:JSON.stringify(body),...options});
function fixture(overrides={}){
  const calls=[];
  const handle=makeRegistrationHandler({allowedOrigins:[origin],
    allowAttempt:async username=>{calls.push(['limit',username]);return true;},
    createAccount:async(...args)=>{calls.push(['create',...args]);return {error:null};},...overrides});
  return {calls,handle};
}

test('registration accepts just username/password and ignores identity/privilege injection',async()=>{
  const f=fixture();
  const response=await f.handle(request({username:' Player_21 ',password:'longpassword',email:'attacker@example.org',user_id:'fake',role:'service_role',email_confirm:false}));
  assert.equal(response.status,201);
  assert.deepEqual(await response.json(),{created:true});
  assert.deepEqual(f.calls,[['limit','player_21'],['create','player_21','longpassword']]);
  assert.equal(response.headers.get('Cache-Control'),'no-store');
});
test('registration rejects malformed names/passwords before touching accounts',async()=>{
  const f=fixture();
  for(const body of [null,{},[],{username:'12',password:'longpassword'},{username:'abc@xyz.com',password:'longpassword'},{username:'player',password:'short'},{username:'player',password:12},{username:'player',password:'a'.repeat(129)}])
    assert.equal((await f.handle(request(body))).status,400);
  assert.deepEqual(f.calls,[]);
});
test('registration fails closed when blocked or rate limiting is unavailable',async()=>{
  const blocked=fixture({allowAttempt:async()=>false});
  assert.equal((await blocked.handle(request({username:'player',password:'longpassword'}))).status,429);
  assert.deepEqual(blocked.calls,[]);
  const unavailable=fixture({allowAttempt:async()=>{throw Error('private database detail');}});
  const response=await unavailable.handle(request({username:'player',password:'longpassword'}));
  assert.equal(response.status,400);assert.ok(!(await response.text()).includes('private'));
});
test('registration rejects other origins, oversized bodies and unsupported methods',async()=>{
  const f=fixture();
  assert.equal((await f.handle(request({}, {headers:{Origin:'https://untrusted.example'}}))).status,403);
  assert.equal((await f.handle(request({padding:'a'.repeat(4100)}))).status,400);
  assert.equal((await f.handle(new Request(origin,{headers:{Origin:origin}}))).status,405);
  const preflight=await f.handle(new Request(origin,{method:'OPTIONS',headers:{Origin:origin}}));
  assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),origin);
  assert.deepEqual(f.calls,[]);
});
test('registration gives the same generic failure for duplicate names and service errors',async()=>{
  const f=fixture({createAccount:async()=>({error:{message:'private address and database constraint'}})});
  const response=await f.handle(request({username:'player',password:'longpassword'}));
  assert.equal(response.status,400);assert.ok(!(await response.text()).includes('private'));
});
test('registration client sends no email and never treats a failed request as success',async()=>{
  const client={functions:{invoke:async(name,{body})=>{
    assert.equal(name,'username-register');assert.deepEqual(body,{username:'player_21',password:'longpassword'});
    return {data:{created:true}};
  }}};
  assert.deepEqual(await registerWithUsername(client,'Player_21','longpassword'),{created:true});
  await assert.rejects(()=>registerWithUsername({functions:{invoke:async()=>({error:new Error('private')})}},'player','longpassword'),/could not be created/);
  assert.throws(()=>validatePassword('short'));assert.throws(()=>validatePassword('a'.repeat(129)));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {makeLoginHandler} from '../supabase/functions/login-notification/handler.js';
import {notifyLogin} from '../src/lib/loginNotification.js';
const origin='https://game.example.org';
function fixture(overrides={}) {
 const sent=[];
 const admin={
 auth:{
 getUser:async()=>({data:{user:{id:'player',email:'owner@example.org',email_confirmed_at:'2026-01-01'}}}),
 getClaims:async()=>({data:{claims:{sub:'player',session_id:'real-session'}}})},
 rpc:async()=>({data:'2026-10-24T12:00:00Z'}),
 from:()=>({update:()=>({eq:()=>({eq:async()=>({error:null})})})})
 };
 Object.assign(admin,overrides);
 return {sent,admin,handle:makeLoginHandler({admin,allowedOrigins:[origin],sendEmail:async input=>sent.push(input)})};
}
function request({token='test',body={},requestOrigin=origin,method='POST'}={}) {
 return new Request(origin,{method,headers:{Origin:requestOrigin,...(token?{Authorization:'Bearer '+token}:{})},
 ...(method==='POST'?{body:JSON.stringify(body)}:{})});
}
test('email recipient cannot be forged in request body',async()=>{
 const f=fixture();
 assert.equal((await f.handle(request({body:{email:'attacker@example.org',session_id:'forged'}}))).status,200);
 assert.deepEqual(f.sent,[{email:'owner@example.org',sessionId:'real-session',createdAt:'2026-10-24T12:00:00Z'}]);
});
test('missing credentials, wrong origin and wrong method cannot send',async()=>{
 const f=fixture();
 assert.equal((await f.handle(request({token:''}))).status,401);
 assert.equal((await f.handle(request({requestOrigin:'https://evil.example'}))).status,403);
 assert.equal((await f.handle(request({method:'GET'}))).status,405);
 assert.equal((await f.handle(request({method:'OPTIONS'}))).status,204);
 assert.equal(f.sent.length,0);
});
test('invalid signed claims and mismatched users cannot send',async()=>{
 for(const claims of [null,{sub:'different',session_id:'s'},{sub:'player'}]){
 const f=fixture();f.admin.auth.getClaims=async()=>({data:{claims}});
 assert.equal((await f.handle(request())).status,401);assert.equal(f.sent.length,0);
 }
});
test('unconfirmed email cannot send',async()=>{
 const f=fixture();f.admin.auth.getUser=async()=>({data:{user:{id:'player',email:'owner@example.org'}}});
 assert.equal((await (await f.handle(request())).json()).status,'skipped');assert.equal(f.sent.length,0);
});
test('duplicate, old or rate-limited session claim skips sending',async()=>{
 const f=fixture({rpc:async()=>({data:null})});
 assert.equal((await (await f.handle(request())).json()).status,'skipped');assert.equal(f.sent.length,0);
});
test('server errors are safe and not reported as delivered',async()=>{
 const f=fixture({rpc:async()=>{throw Error('secret upstream');}});
 const result=await f.handle(request());assert.equal(result.status,503);
 assert.ok(!(await result.text()).includes('secret'));
});
test('client deduplicates concurrent requests and reports delivery only on success',async()=>{
 let calls=0;
 const client={functions:{invoke:async()=>{calls++;return {data:{status:'sent'}};}}};
 const session={access_token:'test-one',user:{id:'player'}};
 assert.deepEqual(await Promise.all([notifyLogin(client,session),notifyLogin(client,session)]),['sent','sent']);
 assert.equal(calls,1);
 assert.equal(await notifyLogin(client,null),'skipped');
 assert.equal(await notifyLogin({functions:{invoke:async()=>({error:{}})}},{...session,access_token:'test-two'}),'unavailable');
});

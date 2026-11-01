import test from 'node:test';
import assert from 'node:assert/strict';
import {googleReturnUrl,beginGoogleSignIn,finishGoogleSignIn,usesGoogle} from '../src/lib/googleAuth.js';

test('Google return preserves the deployment folder without router or query',()=>{
  assert.equal(googleReturnUrl('https://example.com/game/?x=1#/auth'),'https://example.com/game/');
  assert.equal(googleReturnUrl('http://127.0.0.1:5184/#/auth'),'http://127.0.0.1:5184/');
});
test('Google sign-in requests account selection without mail permissions',async()=>{
  let request;
  await beginGoogleSignIn({auth:{signInWithOAuth:async input=>{request=input;return {error:null};}}},'https://example.com/game/#/auth');
  assert.deepEqual(request,{provider:'google',options:{redirectTo:'https://example.com/game/',queryParams:{prompt:'select_account'}}});
});
test('Callback exchanges once after removing code and before router starts',async()=>{
  const events=[];
  const result=await finishGoogleSignIn({auth:{exchangeCodeForSession:async code=>{events.push(code);return {data:{session:{user:{id:'test'}}}};}}},'https://example.com/game/?code=test-code',url=>events.push(url));
  assert.equal(result,'');assert.deepEqual(events,['https://example.com/game/#/auth','test-code']);
});
test('Cancelled callbacks are cleaned without exchanging or exposing provider details',async()=>{
  let cleaned;
  const result=await finishGoogleSignIn(null,'https://example.com/#error=access_denied&error_description=PRIVATE',url=>cleaned=url);
  assert.equal(cleaned,'https://example.com/#/auth');assert.match(result,/cancelled/);assert.ok(!result.includes('PRIVATE'));
});
test('Expired or failed callback gives retry message and ordinary routes stay unchanged',async()=>{
  assert.match(await finishGoogleSignIn({auth:{exchangeCodeForSession:async()=>({error:new Error('PRIVATE')})}},'https://example.com/?code=expired',()=>{}),/start again/);
  assert.equal(await finishGoogleSignIn(null,'https://example.com/#/home',()=>assert.fail('must not change regular route')),'');
});
test('Google accounts identified from trusted provider metadata or linked identities',()=>{
  assert.ok(usesGoogle({app_metadata:{provider:'google'}}));
  assert.ok(usesGoogle({identities:[{provider:'google'}]}));
  assert.ok(!usesGoogle({app_metadata:{account_type:'username'},identities:[{provider:'email'}]}));
});

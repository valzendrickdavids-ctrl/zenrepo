import test from 'node:test';
import assert from 'node:assert/strict';
import {checkGoogleProvider,authErrorMessage,readAuthCallback,finishAuthCallback} from '../src/lib/authFlow.js';
import {startGoogleLogin} from '../src/lib/google.js';
const project={url:'https://project.supabase.co',key:'test-browser-key'};
test('Google click does not initiate OAuth when the provider is disabled',async(t)=>{
 t.mock.method(globalThis,'fetch',async()=>({ok:true,status:200,json:async()=>({external:{google:false}})}));
 let attempts=0;
 await assert.rejects(()=>startGoogleLogin({auth:{signInWithOAuth:async()=>{attempts++;return {error:null};}}},'http://127.0.0.1:5178/#/auth',project),/not enabled/);
 assert.equal(attempts,0);
});
test('disabled provider is detected before leaving the game',async()=>{
 await assert.rejects(()=>checkGoogleProvider(project,async()=>({ok:true,status:200,json:async()=>({external:{google:false}})})),/not enabled/);
 await checkGoogleProvider(project,async(url,options)=>{
  assert.equal(url,'https://project.supabase.co/auth/v1/settings');assert.equal(options.headers.apikey,'test-browser-key');
  return {ok:true,status:200,json:async()=>({external:{google:true}})};
 });
});
test('invalid keys and connectivity errors show safe actionable messages',async()=>{
 await assert.rejects(()=>checkGoogleProvider(project,async()=>({ok:false,status:401})),/browser key/);
 await assert.rejects(()=>checkGoogleProvider(project,async()=>{throw Error('private upstream detail');}),e=>e.message.includes('internet')&&!e.message.includes('private'));
 assert.ok(!authErrorMessage({message:'private upstream detail'}).includes('private'));
});
test('query and hash cancellations return to sign-in with no raw callback data',async()=>{
 for(const tail of ['?error=access_denied&error_description=private','#error=access_denied&error_description=private']){
  const result=await finishAuthCallback(null,'https://game.org/app/'+tail);
  assert.equal(result.path,'/app/#/auth');assert.match(result.notice,/cancelled/);assert.ok(!result.notice.includes('private'));
 }
 assert.equal(readAuthCallback('https://game.org/#/auth').isCallback,false);
});
test('PKCE initialization errors cannot be mistaken for an existing successful session',async()=>{
 let sessions=0;
 const result=await finishAuthCallback({auth:{initialize:async()=>({error:{code:'bad_code_verifier'}}),getSession:async()=>{sessions++;return {data:{session:{}}};}}},'https://game.org/?code=private');
 assert.match(result.notice,/same browser/);assert.equal(sessions,0);
});
test('successful initialization routes home and removes callback credentials',async()=>{
 const result=await finishAuthCallback({auth:{initialize:async()=>({error:null}),getSession:async()=>({data:{session:{user:{id:'test'}}}})}},'https://game.org/?code=private');
 assert.deepEqual(result,{notice:'',path:'/#/'});
});

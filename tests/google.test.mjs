import test from 'node:test';
import assert from 'node:assert/strict';
import {hasGoogle,googleEmail,startGoogleLogin} from '../src/lib/google.js';
import {googlePhoto,profileDefaults,validateProfile} from '../src/lib/profileRules.js';
test('Google identity uses Google metadata rather than another linked provider',()=>{
 const user={email:'primary@example.org',user_metadata:{picture:'https://wrong.org/photo'},
 identities:[{provider:'facebook',identity_data:{email:'wrong@example.org'}},
 {provider:'google',identity_data:{email:'google@example.org',picture:'https://example.org/photo'}}]};
 assert.equal(googleEmail(user),'google@example.org');
 assert.equal(googlePhoto(user),'https://example.org/photo');
 assert.equal(hasGoogle({...user,demo:true}),false);
 assert.equal(hasGoogle({app_metadata:{provider:'email'}}),false);
 assert.equal(validateProfile({...profileDefaults({}),avatar:'google'}).avatar,'google');
});
test('Google OAuth asks for minimal scopes and account selection, with clean return URL',async()=>{
 let actual;
 await startGoogleLogin({auth:{signInWithOAuth:async args=>{actual=args;return {error:null};}}},
 'http://127.0.0.1:5178/?code=secret#/auth');
 assert.deepEqual(actual,{provider:'google',options:{redirectTo:'http://127.0.0.1:5178/',
 scopes:'openid email profile',queryParams:{prompt:'select_account'}}});
 await assert.rejects(()=>startGoogleLogin(null,'https://game.org'));
 await assert.rejects(()=>startGoogleLogin({},'javascript:alert(1)'));
 await assert.rejects(()=>startGoogleLogin({auth:{signInWithOAuth:async()=>({error:{message:'secret'}})}},
 'https://game.org'),e=>!e.message.includes('secret'));
});

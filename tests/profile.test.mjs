import test from 'node:test';
import assert from 'node:assert/strict';
import {profileDefaults,validateProfile,googlePhoto} from '../src/lib/profileRules.js';
test('new and returning profile defaults are explicit and personal fields optional',()=>{
 assert.equal(profileDefaults({name:'Demo'}).onboarding_complete,false);
 assert.equal(profileDefaults({name:'Demo'},true).onboarding_complete,true);
 const p=validateProfile({...profileDefaults({}),display_name:' ',age:''});
 assert.equal(p.display_name,'Player');assert.equal(p.age,null);assert.equal(p.sex,'Prefer not to say');assert.equal(p.onboarding_complete,true);
});
test('profile fields validate age, name, sex and avatar',()=>{
 const base=profileDefaults({});
 for(const age of [-1,0,121,12.5,'not a number'])assert.throws(()=>validateProfile({...base,age}));
 assert.equal(validateProfile({...base,age:'24',avatar:'fox'}).age,24);
 assert.throws(()=>validateProfile({...base,display_name:'x'.repeat(31)}));
 assert.throws(()=>validateProfile({...base,sex:'unknown'}));
 assert.throws(()=>validateProfile({...base,avatar:'javascript:alert(1)'}));
});
test('Google photos only accept valid HTTPS URLs without embedded credentials',()=>{
 for(const avatar_url of ['javascript:alert(1)','http://example.com/pic','https://user:pass@example.com/pic',{}]) assert.equal(googlePhoto({user_metadata:{avatar_url}}),null);
 assert.equal(googlePhoto({app_metadata:{provider:'google'},user_metadata:{avatar_url:'https://example.com/photo.png'}}),'https://example.com/photo.png');
});

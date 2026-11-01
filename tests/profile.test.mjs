import test from 'node:test';
import assert from 'node:assert/strict';
import {profileDefaults,validateProfile,AVATARS} from '../src/lib/profileRules.js';
test('new and returning profile defaults are explicit and personal fields optional',()=>{
 assert.equal(profileDefaults({user_metadata:{username:'player'}}).onboarding_complete,false);
 assert.equal(profileDefaults({user_metadata:{username:'player'}},true).onboarding_complete,true);
 assert.equal(profileDefaults({user_metadata:{username:'player'}}).display_name,'player');
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
test('only preset avatars are accepted after provider pictures are retired',()=>{
 for(const avatar of Object.keys(AVATARS))assert.equal(validateProfile({...profileDefaults({}),avatar}).avatar,avatar);
 for(const avatar of ['google','facebook','https://example.com/photo.png'])assert.throws(()=>validateProfile({...profileDefaults({}),avatar}));
});

test('profile photos accept bounded JPEG data, never external URLs or active image formats',()=>{
 const photo='data:image/jpeg;base64,/9j/AA==',base=profileDefaults({});
 assert.equal(validateProfile({...base,avatar:'rocket',avatar_image:photo}).avatar_image,photo);
 for(const image of ['https://example.com/photo.jpg','data:image/svg+xml;base64,AA==','javascript:alert(1)','data:image/jpeg;base64,'+'A'.repeat(65536)])
  assert.throws(()=>validateProfile({...base,avatar_image:image}));
});

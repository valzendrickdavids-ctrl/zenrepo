import test from 'node:test';
import assert from 'node:assert/strict';
import {setTimeout as wait} from 'node:timers/promises';
import {createProfileAutosave} from '../src/lib/profileAutosave.js';
import {profileDefaults} from '../src/lib/profileRules.js';

const initial=()=>({...profileDefaults({name:'Original'},true)});
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};

test('name preview is immediate and a typing burst automatically saves only its latest value',async()=>{
 const previews=[],writes=[];
 const editor=createProfileAutosave({initial:initial(),delay:5,onDraft:d=>previews.push(d.display_name),save:async d=>writes.push(d.display_name)});
 editor.update('display_name','A');editor.update('display_name','Ali');editor.update('display_name','Alice');
 assert.deepEqual(previews,['A','Ali','Alice']);assert.deepEqual(writes,[]);
 await wait(25);assert.deepEqual(writes,['Alice']);editor.dispose();
});
test('an in-flight save cannot discard newer edits or announce that an older name is fully saved',async()=>{
 const first=deferred(),second=deferred(),writes=[],states=[];
 const editor=createProfileAutosave({initial:initial(),save:d=>{writes.push(d.display_name);return writes.length===1?first.promise:second.promise;},onStatus:s=>states.push(s.kind)});
 editor.update('display_name','First');const pending=editor.flush();
 editor.update('display_name','Latest');first.resolve();await Promise.resolve();
 assert.deepEqual(writes,['First','Latest']);assert.equal(states.includes('saved'),false);
 second.resolve();await pending;assert.equal(states.at(-1),'saved');assert.equal(editor.getDraft().display_name,'Latest');editor.dispose();
});
test('closing flushes a pending name and avatar together without duplicate writes',async()=>{
 const writes=[];const editor=createProfileAutosave({initial:initial(),save:async p=>writes.push(p)});
 editor.update('display_name','New name');editor.update('avatar','fox');await editor.flush();await editor.flush();
 assert.equal(writes.length,1);assert.equal(writes[0].display_name,'New name');assert.equal(writes[0].avatar,'fox');editor.dispose();
});
test('invalid optional age is not sent; correcting it allows automatic saving again',async()=>{
 const writes=[],states=[];const editor=createProfileAutosave({initial:initial(),save:async p=>writes.push(p),onStatus:s=>states.push(s)});
 editor.update('age','121');await assert.rejects(editor.flush(),/whole-number age/);assert.equal(writes.length,0);assert.equal(states.at(-1).kind,'error');
 editor.update('age','');await editor.flush();assert.equal(states.at(-1).kind,'saved');assert.equal(editor.getDraft().age,'');editor.dispose();
});
test('failed saves retain the edited name for retry and never claim it was saved',async()=>{
 let fail=true;const writes=[],states=[];
 const editor=createProfileAutosave({initial:initial(),save:async p=>{if(fail)throw Error('Connection unavailable');writes.push(p.display_name);},onStatus:s=>states.push(s)});
 editor.update('display_name','Keep this name');await assert.rejects(editor.flush(),/Connection/);
 assert.equal(editor.getDraft().display_name,'Keep this name');assert.equal(states.at(-1).kind,'error');
 fail=false;await editor.flush();assert.deepEqual(writes,['Keep this name']);assert.equal(states.at(-1).kind,'saved');editor.dispose();
});
test('disposing an old account cancels queued writes and suppresses completion callbacks',async()=>{
 let writes=0;const states=[],save=deferred();
 const editor=createProfileAutosave({initial:initial(),delay:5,save:async()=>{writes++;await save.promise;},onStatus:s=>states.push(s.kind)});
 editor.update('display_name','First account');const pending=editor.flush();editor.update('display_name','Pending old edit');
 editor.dispose();const count=states.length;save.resolve();await pending;await wait(20);
 assert.equal(writes,1);assert.equal(states.length,count);assert.equal(await editor.flush(),null);
});
test('continuing without edits still records first-time profile setup once',async()=>{
 const writes=[];const editor=createProfileAutosave({initial:profileDefaults({name:'New player'}),save:async p=>writes.push(p)});
 await editor.flush();await editor.flush();assert.equal(writes.length,1);assert.equal(writes[0].onboarding_complete,true);editor.dispose();
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {watchLeaderboard,LEADERBOARD_REFRESH_MS} from '../src/lib/leaderboardRefresh.js';
import {MAX_LOAD_MS} from '../src/lib/loadDeadline.js';

const flush=()=>new Promise(resolve=>setImmediate(resolve));
function surface(t) {
 t.mock.timers.enable({apis:['setTimeout','setInterval','Date'],now:100000});
 const page=new EventTarget(),host=new EventTarget();page.hidden=false;host.navigator={onLine:true};
 return {page,host};
}
test('new scores appear on the next automatic refresh without manual action',async t=>{
 const ui=surface(t),received=[],errors=[];let calls=0;
 const stop=watchLeaderboard({...ui,load:async()=>[{best_score:++calls*100}],onData:data=>received.push(data),onError:e=>errors.push(e)});t.after(stop);
 await flush();assert.equal(calls,1);t.mock.timers.tick(LEADERBOARD_REFRESH_MS-1);await flush();assert.equal(calls,1);
 t.mock.timers.tick(1);await flush();assert.equal(calls,2);assert.equal(received.at(-1)[0].best_score,200);assert.deepEqual(errors,[]);
});
test('hidden and offline pages pause requests; visibility, reconnect and focus wake them',async t=>{
 const ui=surface(t);let calls=0;
 const stop=watchLeaderboard({...ui,load:async()=>{calls++;return [];},onData:()=>{},onError:()=>{}});t.after(stop);await flush();
 ui.page.hidden=true;t.mock.timers.tick(LEADERBOARD_REFRESH_MS*3);await flush();assert.equal(calls,1);
 ui.page.hidden=false;ui.page.dispatchEvent(new Event('visibilitychange'));await flush();assert.equal(calls,2);
 ui.host.navigator.onLine=false;t.mock.timers.tick(LEADERBOARD_REFRESH_MS*3);ui.host.dispatchEvent(new Event('focus'));await flush();assert.equal(calls,2);
 ui.host.navigator.onLine=true;ui.host.dispatchEvent(new Event('online'));await flush();assert.equal(calls,3);
 ui.host.dispatchEvent(new Event('focus'));await flush();assert.equal(calls,4);
});
test('slow loads never overlap and recover after the request deadline',async t=>{
 const ui=surface(t);let calls=0,signal;const errors=[],received=[];
 const stop=watchLeaderboard({...ui,load:s=>{calls++;signal=s;return calls===1?new Promise(()=>{}):Promise.resolve([{best_score:200}]);},onData:data=>received.push(data),onError:e=>errors.push(e)});t.after(stop);await flush();
 for(let i=0;i<5;i++)ui.host.dispatchEvent(new Event('focus'));await flush();assert.equal(calls,1);
 t.mock.timers.tick(MAX_LOAD_MS);await flush();assert.equal(signal.aborted,true);assert.equal(errors.length,1);assert.equal(received.length,0);
 ui.host.dispatchEvent(new Event('online'));await flush();assert.equal(calls,2);assert.equal(received[0][0].best_score,200);
});
test('network failures keep the watcher running and later successes recover',async t=>{
 const ui=surface(t),received=[],errors=[];let calls=0;
 const stop=watchLeaderboard({...ui,load:async()=>{if(++calls===2)throw Error('Offline');return [calls];},onData:data=>received.push(data),onError:e=>errors.push(e.message)});t.after(stop);
 await flush();t.mock.timers.tick(LEADERBOARD_REFRESH_MS);await flush();assert.deepEqual(received,[[1]]);assert.deepEqual(errors,['Offline']);
 t.mock.timers.tick(LEADERBOARD_REFRESH_MS);await flush();assert.deepEqual(received,[[1],[3]]);
});
test('opening offline reports the state and reconnecting loads scores without a reload',async t=>{
 const ui=surface(t),errors=[],received=[];let calls=0;ui.host.navigator.onLine=false;
 const stop=watchLeaderboard({...ui,load:async()=>{calls++;return [200];},onData:data=>received.push(data),onError:e=>errors.push(e.message)});t.after(stop);
 await flush();assert.equal(calls,0);assert.match(errors[0],/Offline/);
 ui.host.navigator.onLine=true;ui.host.dispatchEvent(new Event('online'));await flush();
 assert.equal(calls,1);assert.deepEqual(received,[[200]]);
});
test('leaving a leaderboard aborts the request, ignores late results and removes all triggers',async t=>{
 const ui=surface(t);let resolve,signal,calls=0;const received=[];
 const stop=watchLeaderboard({...ui,load:s=>{calls++;signal=s;return new Promise(r=>{resolve=r;});},onData:data=>received.push(data),onError:e=>received.push(e)});await flush();
 stop();assert.equal(signal.aborted,true);resolve(['old difficulty']);await flush();
 t.mock.timers.tick(LEADERBOARD_REFRESH_MS*3);ui.page.dispatchEvent(new Event('visibilitychange'));ui.host.dispatchEvent(new Event('online'));ui.host.dispatchEvent(new Event('focus'));await flush();
 assert.equal(calls,1);assert.deepEqual(received,[]);
});

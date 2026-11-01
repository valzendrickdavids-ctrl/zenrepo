import test from 'node:test';
import assert from 'node:assert/strict';
import {withScoreAudit,recordScoreAnswer,scoreSnapshot} from '../src/lib/scoreAudit.js';
import {newRun,points} from '../src/lib/engine.js';
import {levels} from '../src/data/levels.js';
import {pausedRun} from '../src/lib/experience.js';
import {queueScore,pendingScores,flushScoreQueue} from '../src/lib/scoreQueue.js';

test('new ranked runs have a zero baseline and immutable, exact answer records',()=>{
 const run=newRun(levels,'easy'),answer=' USB Flash Drive ';
 const wrong=recordScoreAnswer(run,answer,52.123);
 assert.equal(run.scoreAudit.events.length,0);assert.equal(wrong.scoreAudit.events[0].guess,answer);
 const timeout=recordScoreAnswer(wrong,null,0);assert.equal(wrong.scoreAudit.events.length,1);
 assert.deepEqual(timeout.scoreAudit.events[1],{index:0,guess:null,remaining:0});
 assert.deepEqual(run.scoreAudit,{version:1,baseIndex:0,baseScore:0,baseCorrect:0,events:[]});
});
test('legacy saves keep a starting baseline without inventing past answers',()=>{
 const old={...newRun(levels,'easy'),index:4,score:1700,correct:3};delete old.scoreAudit;
 assert.deepEqual(withScoreAudit(old).scoreAudit,{version:1,baseIndex:4,baseScore:1700,baseCorrect:3,events:[]});
 assert.equal(withScoreAudit({...old,phase:'answered'}).scoreAudit.baseIndex,5);
 assert.equal(withScoreAudit({...old,phase:'complete'}).scoreAudit.baseIndex,100);
 assert.equal(old.scoreAudit,undefined);
});
test('paused timers never round up and grant extra scoring time on resume',()=>{
 const r={deadline:15234,remaining:60};assert.equal(pausedRun(r,10000).remaining,5.234);
 for(const mode of ['easy','medium','hard'])assert.equal(points(5.234,mode),points(pausedRun(r,10000).remaining,mode));
});
test('score snapshots retain complete proof, exclude unrelated data, and cannot mutate the run',()=>{
 const run=recordScoreAnswer(newRun(levels,'hard'),'CPU',23.125),snapshot=scoreSnapshot(run);
 assert.equal(snapshot.brushing,undefined);assert.equal(snapshot.savedRuns,undefined);
 assert.deepEqual(snapshot.scoreAudit,run.scoreAudit);snapshot.scoreAudit.events[0].guess='Changed';
 snapshot.order.reverse();assert.equal(run.scoreAudit.events[0].guess,'CPU');assert.notDeepEqual(snapshot.order,run.order);
 assert.deepEqual(scoreSnapshot({id:'old',difficulty:'easy',score:5}),{id:'old',difficulty:'easy',score:5});
});
test('offline retries preserve the exact answer history for the highest queued score',async t=>{
 const data=new Map(),old=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)}});
 t.after(()=>{if(old)Object.defineProperty(globalThis,'localStorage',old);else delete globalThis.localStorage;});
 const user={id:'audit-check'},r={...recordScoreAnswer(newRun(levels,'easy'),'Keyboard',50),score:833,index:0,phase:'answered',correct:1};
 queueScore(user,r);const payload=pendingScores(user)[0];assert.deepEqual(payload,scoreSnapshot(r));
 await flushScoreQueue(user,async()=>{throw Error('Offline');});assert.deepEqual(pendingScores(user)[0],payload);
 let sent;await flushScoreQueue(user,async(_,snapshot)=>{sent=snapshot;});assert.deepEqual(sent,payload);assert.equal(pendingScores(user).length,0);
});

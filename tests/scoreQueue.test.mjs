import test from 'node:test';
import assert from 'node:assert/strict';
import {queueScore,pendingScores,acknowledgeScore,flushScoreQueue,clearPendingScores} from '../src/lib/scoreQueue.js';
const user={id:'queue-test'},other={id:'other-player'};
const score=(value=100)=>({id:'run-1',difficulty:'easy',score:value});
function storage(t){const values=new Map(),previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}});t.after(()=>{if(previous)Object.defineProperty(globalThis,'localStorage',previous);else delete globalThis.localStorage;});}
test('pending scores are durable, scoped to their account and preserve the highest snapshot',t=>{
 storage(t);assert.equal(queueScore(user,score()),true);queueScore(user,score(200));queueScore(user,score(50));
 assert.deepEqual(pendingScores(user),[score(200)]);assert.deepEqual(pendingScores(other),[]);
 acknowledgeScore(user,score(100));assert.equal(pendingScores(user).length,1);acknowledgeScore(user,score(200));assert.deepEqual(pendingScores(user),[]);
});
test('failed uploads stay queued and a later retry clears them',async t=>{
 storage(t);queueScore(user,score());let result=await flushScoreQueue(user,async()=>{throw Error('Offline');});assert.equal(result.remaining,1);
 result=await flushScoreQueue(user,async()=>{});assert.equal(result.uploaded,1);assert.equal(result.remaining,0);
});
test('concurrent retry calls share a single upload and retain a newer pending score',async t=>{
 storage(t);queueScore(user,score());let release,calls=0;const submit=()=>{calls++;return new Promise(resolve=>{release=resolve;});};
 const first=flushScoreQueue(user,submit),second=flushScoreQueue(user,submit);assert.equal(first,second);queueScore(user,score(300));release();await first;
 assert.equal(calls,1);assert.deepEqual(pendingScores(user),[score(300)]);
});
test('account changes stop retries and reset clears old pending scores',async t=>{
 storage(t);queueScore(user,score());let calls=0;await flushScoreQueue(user,async()=>{calls++;},()=>false);assert.equal(calls,0);clearPendingScores(user);assert.deepEqual(pendingScores(user),[]);
});

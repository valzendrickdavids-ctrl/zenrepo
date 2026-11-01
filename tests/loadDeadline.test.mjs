import test from 'node:test';
import assert from 'node:assert/strict';
import {loadWithDeadline,PROGRESS_MIN_LOAD_MS,MAX_LOAD_MS} from '../src/lib/loadDeadline.js';

const flush=()=>new Promise(resolve=>setImmediate(resolve));
function clock(t){t.mock.timers.enable({apis:['setTimeout','Date'],now:100000});}

test('fast progress loads finish at three seconds, not earlier',async t=>{
  clock(t);let finished=false;
  const task=loadWithDeadline(()=>Promise.resolve('cloud'),{minimumMs:PROGRESS_MIN_LOAD_MS}).then(value=>{finished=true;return value;});
  await flush();t.mock.timers.tick(2999);await flush();assert.equal(finished,false);
  t.mock.timers.tick(1);assert.equal(await task,'cloud');
});

test('a slow response inside the deadline opens immediately when ready',async t=>{
  clock(t);
  const task=loadWithDeadline(()=>new Promise(resolve=>setTimeout(()=>resolve('cloud'),6000)),{minimumMs:PROGRESS_MIN_LOAD_MS});
  await flush();t.mock.timers.tick(6000);assert.equal(await task,'cloud');assert.equal(Date.now(),106000);
});

test('a stalled request is bounded at ten seconds even if it ignores abort',async t=>{
  clock(t);let signal,release,finished=false;
  const task=loadWithDeadline(s=>{signal=s;return new Promise(resolve=>{release=resolve;});},{minimumMs:PROGRESS_MIN_LOAD_MS,timeoutMessage:'Cloud load timed out.'});
  const failure=task.catch(error=>{finished=true;return error;});await flush();
  t.mock.timers.tick(MAX_LOAD_MS-1);await flush();assert.equal(finished,false);assert.equal(signal.aborted,false);
  t.mock.timers.tick(1);const error=await failure;assert.equal(error.code,'LOAD_TIMEOUT');assert.equal(error.message,'Cloud load timed out.');assert.equal(signal.aborted,true);
  release('late cloud result');await flush();assert.equal(await failure,error);
});

test('early network errors respect the minimum and retain the original error',async t=>{
  clock(t);const error=new Error('Disconnected');let finished=false;
  const failure=loadWithDeadline(()=>{throw error;},{minimumMs:PROGRESS_MIN_LOAD_MS}).catch(e=>{finished=true;return e;});
  await flush();t.mock.timers.tick(2999);await flush();assert.equal(finished,false);
  t.mock.timers.tick(1);assert.equal(await failure,error);
});

test('successful profile requests have no artificial delay or later abort',async t=>{
  clock(t);let signal;
  const result=await loadWithDeadline(s=>{signal=s;return Promise.resolve('profile');});
  assert.equal(result,'profile');assert.equal(Date.now(),100000);t.mock.timers.tick(MAX_LOAD_MS);assert.equal(signal.aborted,false);
});

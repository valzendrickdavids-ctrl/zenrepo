import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeRunSaves,withSavedRuns} from '../src/lib/runSaves.js';

const run=(difficulty,updatedAt,score=0)=>({id:`${difficulty}-${updatedAt}`,difficulty,updatedAt,score});

test('a legacy save becomes a save for its original difficulty only',()=>{
  const easy=run('easy',1,420);
  assert.deepEqual(mergeRunSaves(easy),{easy});
});

test('switching and replacing one difficulty preserves the other two',()=>{
  const easy=run('easy',1),medium=run('medium',2),hard=run('hard',3);
  const saved=withSavedRuns(hard,withSavedRuns(medium,easy));
  const replacement=run('medium',4,500);
  assert.deepEqual(withSavedRuns(replacement,saved).savedRuns,{easy,medium:replacement,hard});
  assert.equal(saved.savedRuns.medium.id,medium.id);
});

test('local and cloud saves choose the newest progress separately for each mode',()=>{
  const oldEasy=run('easy',1),newEasy=run('easy',4,1977),medium=run('medium',2),hard=run('hard',3);
  const merged=mergeRunSaves(withSavedRuns(hard,oldEasy),withSavedRuns(medium,newEasy));
  assert.deepEqual(merged,{easy:newEasy,medium,hard});
});

test('saved collections remain flat after repeated autosaves and ignore mismatched modes',()=>{
  let saved=run('easy',1);
  for(let i=2;i<100;i++)saved=withSavedRuns(run('easy',i),saved);
  assert.equal(saved.savedRuns.easy.savedRuns,undefined);
  assert.ok(JSON.stringify(saved).length<300);
  assert.deepEqual(mergeRunSaves({savedRuns:{easy:run('hard',1),medium:run('invalid',2)}}),{});
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {pausedRun,completionAwards,validateFeedback,tutorialKey} from '../src/lib/experience.js';
test('quit pauses using the current deadline without resetting points or clues',()=>{const run={remaining:60,deadline:15000,score:123,index:4};const paused=pausedRun(run,10000);assert.equal(paused.remaining,5);assert.equal(paused.deadline,null);assert.equal(paused.score,123);assert.equal(run.deadline,15000);});
test('expired rounds cannot gain time when quitting',()=>{assert.equal(pausedRun({deadline:1000,remaining:10},2000).remaining,0);assert.equal(pausedRun(null),null);});
test('categories have three distinct appreciation awards',()=>{assert.equal(new Set(Object.values(completionAwards).map(a=>a.title)).size,3);assert.equal(new Set(Object.values(completionAwards).map(a=>a.icon)).size,3);});
test('feedback is trimmed and constrained',()=>{assert.deepEqual(validateFeedback('Suggestion','  Please add more clues.  '),{category:'Suggestion',message:'Please add more clues.'});assert.throws(()=>validateFeedback('Bug report','short'));assert.throws(()=>validateFeedback('Other','x'.repeat(2001)));assert.throws(()=>validateFeedback('admin','long enough message'));});
test('tutorial completion is scoped to the player',()=>{assert.notEqual(tutorialKey('alice'),tutorialKey('bob'));});

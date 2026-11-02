import test from 'node:test';
import assert from 'node:assert/strict';
import { levels, poolCounts } from '../src/data/levels.js';
import { newRun, validRun, matches } from '../src/lib/engine.js';
import { hints } from '../src/data/hints.js';
import {answerOptions,cleanAnswerSpaces,namedAlias} from '../src/lib/answerRules.js';
test('every clue has a specific hint without its answer or aliases',()=>{
 assert.equal(Object.keys(hints).length,225);
 for(const [mode,count] of Object.entries(poolCounts)){
  const pool=levels.filter(l=>l.difficulty===mode);
  assert.equal(pool.length,count);
  for(const level of pool){
   assert.equal(typeof level.hint,'string',level.id);
   assert.ok(level.hint.trim().length>=20,level.id);
   const normalize=s=>s.toLowerCase().replace(/\*/g,'star').replace(/[^a-z0-9]/g,'');
   for(const answer of [level.answer,...level.aliases]){
    assert.ok(!normalize(level.hint).includes(normalize(answer)),`${level.id}: hint contains ${answer}`);
   }
  }
 }
});
test('each mode draws its complete distinct pool and no other mode',()=>{
 const seen=new Set();
 for(const [mode,count] of Object.entries(poolCounts)){
  for(let i=0;i<20;i++){
   const r=newRun(levels,mode);
   assert.equal(r.order.length,count);assert.equal(new Set(r.order).size,count);
   assert.ok(r.order.every(id=>levels.find(l=>l.id===id).difficulty===mode));
   assert.ok(validRun(r,levels));
  }
  for(const l of levels.filter(l=>l.difficulty===mode)){assert.ok(!seen.has(l.id));seen.add(l.id);}
 }
 assert.equal(seen.size,225);
});
test('cross-mode and old-library saves are rejected',()=>{
 const r=newRun(levels,'easy'),order=[...r.order];order[0]=levels.find(l=>l.difficulty==='hard').id;
 assert.equal(Boolean(validRun({...r,order},levels)),false);
 assert.equal(Boolean(validRun({...r,version:2},levels)),false);
});
test('all 225 stages preserve their naming convention and difficulty-specific alternatives',()=>{
 for(const l of levels){
  assert.ok(matches(l,l.answer),l.id);
  assert.equal(matches(l,l.answer.toLowerCase()),false,l.id+': capitalization');
  assert.equal(matches(l,' '+l.answer+'  '),l.difficulty==='easy',l.id+': spacing');
  const {blocked}=answerOptions(l);
  for(const alias of l.aliases){const named=namedAlias(alias);assert.equal(matches(l,named),l.difficulty==='hard'?named===l.answer:!blocked.includes(named)||l.difficulty==='easy',l.id+': '+named);}
  if(l.difficulty==='hard')for(const guess of [l.answer.toUpperCase(),l.answer+' extra',l.answer.slice(0,-1),l.answer.replace(/ /g,'  '),l.answer.replace(/[ -]/g,'')])if(guess!==l.answer)assert.equal(matches(l,guess),false,l.id+': '+guess);
 }
 assert.equal(cleanAnswerSpaces(' \tUSB  flash\ndrive '),'USB flash drive');
 assert.equal(matches(levels.find(l=>l.id==='a-star'),'a'),false);
});


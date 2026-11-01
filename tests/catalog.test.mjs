import test from 'node:test';
import assert from 'node:assert/strict';
import { levels, poolCounts } from '../src/data/levels.js';
import { newRun, validRun, matches } from '../src/lib/engine.js';
import { hints } from '../src/data/hints.js';
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
test('all 225 stages accept only their official answer and reject every alternate variation',()=>{
 for(const l of levels){
  assert.ok(matches(l,l.answer),l.id);
  for(const a of l.aliases)assert.equal(matches(l,a),a===l.answer,l.id+': '+a);
  const variants=[l.answer.toLowerCase(),l.answer.toUpperCase(),' '+l.answer,l.answer+' ',l.answer+' extra',l.answer.slice(0,-1),l.answer.replace(/ /g,'  '),l.answer.replace(/[ -]/g,'')];
  for(const guess of variants)if(guess!==l.answer)assert.equal(matches(l,guess),false,l.id+': '+guess);
 }
 assert.equal(matches(levels.find(l=>l.id==='a-star'),'a'),false);
});


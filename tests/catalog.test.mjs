import test from 'node:test';
import assert from 'node:assert/strict';
import { levels, poolCounts } from '../src/data/levels.js';
import { newRun, validRun, matches } from '../src/lib/engine.js';
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
test('every catalog answer and alias is accepted',()=>{
 for(const l of levels){assert.ok(matches(l,l.answer),l.id);for(const a of l.aliases)assert.ok(matches(l,a),l.id+': '+a);}
 assert.equal(matches(levels.find(l=>l.id==='a-star'),'a'),false);
});


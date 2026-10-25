import test from 'node:test';
import assert from 'node:assert/strict';
import { BrushEngine, STROKE_LIMIT, TOTAL_CELLS, RECOVERY_MS } from '../src/lib/brushEngine.js';
import { difficulties, points } from '../src/lib/engine.js';
test('every fast move is bounded before erasing, in every difficulty',()=>{
 for(const d of Object.values(difficulties)){
  const m=new BrushEngine(d.attempts);assert.ok(m.start(1,100));
  for(let i=0;i<100;i++){
   m.move(1,i%2?600:0,i*17%400,d.brush,101+i);
   assert.ok(m.stroke.size<=STROKE_LIMIT);
   assert.ok(m.stroke.size*4<=600*400*.07);
  }
  assert.equal(m.stroke.size,STROKE_LIMIT);
  assert.equal(m.used,1);
 }
});
test('release zeros readout immediately but retains coverage for scoring',()=>{
 const m=new BrushEngine(8);m.start(1,100);m.move(1,200,200,42,101);
 const coverage=m.scoringCoverage,score=points(coverage,30,'easy');
 assert.ok(m.revealed>0);m.end(1,200);
 assert.equal(m.revealed,0);assert.equal(m.scoringCoverage,coverage);
 assert.equal(points(m.scoringCoverage,30,'easy'),score);
});
test('all attempts during recovery are ignored until exactly 2000ms',()=>{
 const m=new BrushEngine(8);m.start(1,100);m.move(1,100,100,42,101);m.end(1,200);
 assert.equal(RECOVERY_MS,2000);
 const snapshot=m.snapshot();
 for(let t=201;t<200+RECOVERY_MS;t+=10){
  assert.equal(m.start(2,t),false);assert.deepEqual(m.move(2,500,300,42,t),[]);
 }
 assert.deepEqual(m.snapshot(),snapshot);
 assert.equal(m.start(2,2199),false);
 assert.equal(m.start(2,2200),true);assert.equal(m.used,2);
});
test('attempt caps persist and cannot be bypassed by other pointers or duplicate releases',()=>{
 for(const d of Object.values(difficulties)){
  const m=new BrushEngine(d.attempts);let now=10;
  for(let i=0;i<d.attempts;i++){
   assert.ok(m.start(1,now));assert.equal(m.start(2,now),false);
   assert.deepEqual(m.move(2,100,100,42,now),[]);
   assert.equal(m.end(2,now),false);assert.ok(m.end(1,now));
   assert.equal(m.end(1,now),false);now+=2000;
  }
  assert.equal(m.start(1,now),false);
  const restored=new BrushEngine(d.attempts,m.snapshot(),now+10000);
  assert.equal(restored.start(1,now+10000),false);
 }
});
test('interrupted active strokes recover after reload without refunding attempts',()=>{
 const m=new BrushEngine(8);m.start(1,100);m.move(1,200,200,42,101);
 const restored=new BrushEngine(8,m.snapshot(),500);
 assert.equal(restored.used,1);assert.equal(restored.revealed,0);
 assert.equal(restored.start(1,2499),false);assert.equal(restored.start(1,2500),true);
 assert.equal(restored.used,2);
});
test('overlapping strokes count unique coverage once and stay separate from the HUD',()=>{
 const m=new BrushEngine(8);m.start(1,100);m.move(1,200,200,42,101);m.end(1,102);
 const count=m.seen.size;m.start(1,2102);m.move(1,200,200,42,2103);
 assert.equal(m.seen.size,count);assert.ok(m.seen.size/TOTAL_CELLS<=.07);
});

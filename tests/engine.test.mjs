import test from 'node:test';
import assert from 'node:assert/strict';
import { difficulties, matches, points, shuffle, newRun, validRun } from '../src/lib/engine.js';
import { validateConfig } from '../src/lib/config.js';
import { levels } from '../src/data/levels.js';
test('smaller brush radii are fixed for every difficulty',()=>{
  assert.deepEqual(Object.values(difficulties).map(d=>d.brush),[24,18,12]);
});
test('shuffling never loses or duplicates clues',()=>{
  for(let i=0;i<100;i++){const order=shuffle(levels.map(l=>l.id));assert.equal(new Set(order).size,225);assert.deepEqual([...order].sort(),levels.map(l=>l.id).sort());}
});
test('early answers earn more, with correct multipliers',()=>{
  assert.equal(points(0,60,'easy'),1300);assert.equal(points(100,0,'easy'),0);
  assert.equal(points(50,20,'medium'),900);assert.equal(points(50,20,'hard'),1200);
  assert.ok(points(10,20,'easy')>points(80,20,'easy'));
});
test('answer aliases ignore case, spaces and punctuation',()=>{
  assert.ok(matches(levels.find(l=>l.id==='cpu'),'Central Processing Unit'));
  assert.ok(matches(levels.find(l=>l.id==='usb-drive'),'USB flash-drive'));
  assert.equal(matches(levels[0],'not a keyboard'),false);
});
test('save validation rejects unknown, duplicate or malformed clues',()=>{
  const r=newRun(levels,'easy');assert.ok(validRun(r,levels));
  assert.equal(Boolean(validRun({...r,order:Array(18).fill('cpu')},levels)),false);
  assert.equal(Boolean(validRun({...r,index:100},levels)),false);
  assert.equal(Boolean(validRun({...r,brushing:{...r.brushing,stroke:[60000]}},levels)),false);
  assert.equal(Boolean(validRun({...r,difficulty:'unknown'},levels)),false);
});
test('configuration blocks malformed URLs and privileged keys without returning values in errors',()=>{
  for(const url of ['[https://project.supabase.co]','https://your-project-ref.supabase.co','https://supabase.com/dashboard/project/id','postgres://user:password@host/db','https://user:password@host.test','https://host.test?secret=x']){
    const result=validateConfig(url,'sb_publishable_test');assert.equal(result.valid,false);assert.equal(result.message.includes(url),false);
  }
  assert.equal(validateConfig('https://project.supabase.co','sb_secret_test').valid,false);
  const privileged='e30.'+btoa(JSON.stringify({role:'service_role'}))+'.sig';
  assert.equal(validateConfig('https://project.supabase.co',privileged).valid,false);
});
test('configuration supports publishable, legacy anon, custom domains and local development',()=>{
  const anon='e30.'+btoa(JSON.stringify({role:'anon'}))+'.sig';
  for(const url of ['https://project.supabase.co','https://api.custom.test','http://127.0.0.1:54321']){
    assert.equal(validateConfig(url,'sb_publishable_test').valid,true);
    assert.equal(validateConfig(url,anon).valid,true);
  }
  assert.equal(validateConfig().valid,false);
  assert.equal(Object.keys(difficulties).length,3);
});


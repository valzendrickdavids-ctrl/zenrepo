import test from 'node:test';
import assert from 'node:assert/strict';
import { difficulties, matches, answerPattern, points, shuffle, newRun, validRun } from '../src/lib/engine.js';
import { validateConfig } from '../src/lib/config.js';
import { levels } from '../src/data/levels.js';
test('smaller brush radii are fixed for every difficulty',()=>{
  assert.deepEqual(Object.values(difficulties).map(d=>d.brush),[24,18,12]);
});
test('shuffling never loses or duplicates clues',()=>{
  for(let i=0;i<100;i++){const order=shuffle(levels.map(l=>l.id));assert.equal(new Set(order).size,225);assert.deepEqual([...order].sort(),levels.map(l=>l.id).sort());}
});
test('correct-answer rewards decrease with elapsed time in every difficulty',()=>{
  for(const [mode,d] of Object.entries(difficulties)){
    assert.equal(points(d.seconds,mode),1000*d.multiplier);
    assert.equal(points(d.seconds/2,mode),500*d.multiplier);
    for(let remaining=d.seconds;remaining>1;remaining--){
      assert.ok(points(remaining,mode)>points(remaining-1,mode),mode);
    }
    assert.ok(points(d.seconds-0.1,mode)>points(d.seconds-0.5,mode),mode);
  }
});
test('expired and invalid timers cannot earn points; live rewards stay within the difficulty cap',()=>{
  for(const [mode,d] of Object.entries(difficulties)){
    for(const remaining of [0,-1,NaN,Infinity,-Infinity])assert.equal(points(remaining,mode),0);
    assert.equal(points(d.seconds+1000,mode),1000*d.multiplier);
    assert.equal(points(0.001,mode),1);
  }
  assert.equal(points(30,'unknown'),0);
});
test('only the exact official answer is accepted, with no normalization or synonyms',()=>{
  const cpu=levels.find(l=>l.id==='cpu'),usb=levels.find(l=>l.id==='usb-drive'),wifi=levels.find(l=>l.id==='wifi');
  assert.ok(matches(cpu,'CPU'));
  for(const guess of ['cpu','Cpu',' CPU','CPU ','C P U','Central Processing Unit','CP','CPU device','C\u0420U',null,undefined,42,['CPU'],new String('CPU')])assert.equal(matches(cpu,guess),false,String(guess));
  assert.ok(matches(usb,'USB flash drive'));
  for(const guess of ['USB flash-drive','USB Flash Drive','USB  flash drive','USB\tflash drive','USB drive'])assert.equal(matches(usb,guess),false,guess);
  assert.ok(matches(wifi,'Wi-Fi'));
  for(const guess of ['WiFi','wi-fi','Wi‑Fi','Wi Fi'])assert.equal(matches(wifi,guess),false,guess);
  assert.equal(matches({answer:'Caf\u00e9'},'Cafe\u0301'),false);
  assert.equal(matches({},''),false);
});

test('the naming pattern masks letters and digits while preserving case, spaces and symbols',()=>{
  for(const [answer,pattern] of [['CPU','AAA'],['USB flash drive','AAA aaaaa aaaaa'],['JavaScript','AaaaAaaaaa'],['Wi-Fi','Aa-Aa'],['2FA','0AA'],['C++','A++'],['C#','A#']])assert.equal(answerPattern(answer),pattern);
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


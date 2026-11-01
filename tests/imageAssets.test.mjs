import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {catalog} from '../src/data/catalog.js';
import {levels} from '../src/data/levels.js';
import {rasterImages} from '../src/data/rasterImages.js';

test('image replacements preserve every concept, answer, alias, fact and difficulty',()=>{
 assert.equal(levels.length,catalog.length);
 for(const original of catalog){
  const {visual,icon,image,...content}=original;
  const {hint,image:replacement,...current}=levels.find(l=>l.id===original.id);
  assert.deepEqual(current,content,original.id);
  assert.equal(replacement,rasterImages[original.id]?.image||image);
 }
});

test('existing photo and screenshot assets have valid local files and source credits',async()=>{
 const hashes=new Set();
 for(const [id,asset] of Object.entries(rasterImages)){
  assert.ok(catalog.some(l=>l.id===id),id);
  assert.match(asset.image,/^\.\/images\/(photos|screenshots)\/(beginner|moderate|expert)\/[a-z0-9-]+\.(jpg|png)$/);
  assert.ok(['photograph','screenshot'].includes(asset.kind),id);
  assert.ok(asset.artist&&asset.license,id);
  assert.equal(new URL(asset.page).hostname,'commons.wikimedia.org',id);
  const bytes=await readFile(new URL('../public/'+asset.image.slice(2),import.meta.url));
  assert.ok((bytes[0]===0xff&&bytes[1]===0xd8)||bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),id);
  assert.ok(!hashes.has(asset.image),id);hashes.add(asset.image);
 }
});

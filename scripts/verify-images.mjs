import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { levels, poolCounts } from '../src/data/levels.js';
import { rasterImages } from '../src/data/rasterImages.js';
const hashes=new Set(),ids=new Set(),answers=new Set();
for(const level of levels){
  if(ids.has(level.id))throw Error('Duplicate ID: '+level.id);ids.add(level.id);
  if(answers.has(level.answer.toLowerCase()))throw Error('Duplicate answer: '+level.answer);answers.add(level.answer.toLowerCase());
  const bytes=await readFile(new URL('../public/'+level.image.replace('./',''),import.meta.url));
  const asset=rasterImages[level.id];
  if(asset){
    const jpeg=bytes[0]===0xff&&bytes[1]===0xd8;
    const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    if(!jpeg&&!png)throw Error('Expected a real raster image: '+level.id);
    if(!asset.page||!asset.artist||!asset.license||!['photograph','screenshot'].includes(asset.kind))throw Error('Missing image provenance: '+level.id);
  }else{
    const svg=bytes.toString('utf8');
    if(!svg.includes('<svg')||!svg.includes('viewBox="0 0 600 400"'))throw Error('Invalid original artwork: '+level.id);
  }
  const hash=createHash('sha256').update(bytes).digest('hex');
  if(hashes.has(hash))throw Error('Duplicate artwork: '+level.id);hashes.add(hash);
  if(!level.fact||!level.aliases.length)throw Error('Missing clue content: '+level.id);
}
for(const [mode,count] of Object.entries(poolCounts)){
  const dir={easy:'beginner',medium:'moderate',hard:'expert'}[mode];
  const files=await readdir(new URL('../public/images/'+dir+'/',import.meta.url));
  if(levels.filter(l=>l.difficulty===mode).length!==count||files.filter(f=>f.endsWith('.svg')).length!==count)throw Error('Wrong count: '+mode);
}
if(levels.length!==225)throw Error('Expected exactly 225 clues.');
console.log('PASS: 100 Beginner + 75 Moderate + 50 Expert; 225 unique IDs, answers and image files. '+Object.keys(rasterImages).length+' existing photos/screenshots; '+(225-Object.keys(rasterImages).length)+' original images retained by request.');


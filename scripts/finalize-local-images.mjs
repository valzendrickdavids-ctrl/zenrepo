import {readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {catalog} from '../src/data/catalog.js';
const tmp=new URL('../../tmp/photo-refresh/',import.meta.url),root=new URL('../',import.meta.url);
const retired=new Set(['video-call','hide-password','zoom-in','software-bug','binary']);
const manifestFile=new URL('screenshot-manifest.json',tmp),screens=JSON.parse(await readFile(manifestFile,'utf8'));
let gallery=await readFile(new URL('image-library.html',root),'utf8');
for(const id of retired){
 if(screens[id])gallery=gallery.replaceAll('public/'+screens[id].image.slice(2),'public/'+catalog.find(l=>l.id===id).image.slice(2));
 delete screens[id];
}
await writeFile(manifestFile,JSON.stringify(screens,null,2));await writeFile(new URL('image-library.html',root),gallery);
const baseline=JSON.parse(await readFile(new URL('original-concepts.json',tmp),'utf8'));
assert.deepEqual(catalog.map(({image,...content})=>content),baseline,'Original concepts must remain identical.');
// These two directories were created for this image update. Remove only the
// explicitly rejected downloads; never touch the original SVG directories.
for(const projectRoot of [fileURLToPath(root),path.resolve(fileURLToPath(root),'../game-experience-update/clear-and-conquer')]){
 const directory=path.resolve(projectRoot,'public/images/screenshots/beginner');
 let names=[];try{names=await readdir(directory);}catch{}
 for(const name of names){
  if(!retired.has(path.parse(name).name)||!/^[-a-z0-9]+\.(png|jpg)$/.test(name))continue;
  const file=path.resolve(directory,name);assert.ok(file.startsWith(directory+path.sep));await rm(file);
 }
}
console.log('Original concept data and answers are preserved; rejected downloads removed.');

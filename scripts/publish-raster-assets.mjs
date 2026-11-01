import {readFile,writeFile} from 'node:fs/promises';
import {catalog} from '../src/data/catalog.js';
const tmp=new URL('../../tmp/photo-refresh/',import.meta.url);
const load=async name=>{try{return JSON.parse(await readFile(new URL(name,tmp),'utf8'));}catch{return {};}};
const photos=await load('photo-manifest.json'),screenshots=await load('screenshot-manifest.json');
// The original file page identifies the uploader but has no named author field.
if(screenshots.calendar&&!screenshots.calendar.artist){
 screenshots.calendar.artist='Creator not specified; uploaded by Square87~commonswiki';
 screenshots.calendar.licenseUrl='https://www.mozilla.org/MPL/1.1/';
}
const assets={...photos,...screenshots};
await writeFile(new URL('../src/data/rasterImages.js',import.meta.url),'// Existing photographs and application screenshots with source credits.\nexport const rasterImages = '+JSON.stringify(assets,null,2)+';\n');
const esc=s=>String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const credits=catalog.filter(l=>assets[l.id]).map(l=>{
 const a=assets[l.id];return '<article><h2>'+esc(l.answer)+'</h2><p>'+esc(a.kind)+' | '+esc(a.artist)+'</p><p><a href="'+esc(a.page)+'">Original file and attribution</a> | <a href="'+esc(a.licenseUrl||a.page)+'">'+esc(a.license)+'</a></p><p>'+esc(a.changes||'Original screenshot; Wikimedia thumbnail.')+'</p></article>';
}).join('\n');
await writeFile(new URL('../public/image-credits.html',import.meta.url),'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Clear & Conquer | Image credits</title><style>body{max-width:850px;margin:40px auto;padding:0 24px;font:16px/1.7 system-ui;color:#222}article{padding:20px 0;border-bottom:1px solid #ddd}h2{font-size:20px}a{color:#672878}</style><h1>Image credits</h1><p>Existing photographs and application screenshots used in Clear & Conquer. Credits and source licenses are preserved below. Unreplaced illustrations retain their existing licenses.</p>'+credits+'</html>');
const missing=catalog.filter(l=>!assets[l.id]).map(l=>({id:l.id,answer:l.answer,difficulty:l.difficulty}));
await writeFile(new URL('unmatched-concepts.json',tmp),JSON.stringify(missing,null,2));
let gallery=await readFile(new URL('../image-library.html',import.meta.url),'utf8');
for(const level of catalog){
 const asset=assets[level.id];if(!asset)continue;
 gallery=gallery.replaceAll('public/'+level.image.slice(2),'public/'+asset.image.slice(2));
}
gallery=gallery.replace('225 SVG visual clues:','225 visual clues:').replaceAll('Download SVG','Download image');
await writeFile(new URL('../image-library.html',import.meta.url),gallery);
console.log('Ready local raster assets: '+Object.keys(assets).length+'; original images retained by request: '+missing.length);

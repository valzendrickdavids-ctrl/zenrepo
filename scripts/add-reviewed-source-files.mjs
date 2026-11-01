import {readFile,writeFile} from 'node:fs/promises';
const tmp=new URL('../../tmp/photo-refresh/',import.meta.url);
const known={key:['photo','File:Llaves casa.jpg'],'optical-disc':['photo','File:CD autolev crop new.jpg'],flowchart:['screenshot','File:Dia 0.97 - Flowchart example.png'],http:['screenshot','File:HTTP Debugger Screenshot.png']};
const url=new URL('https://commons.wikimedia.org/w/api.php');
url.search=new URLSearchParams({action:'query',titles:Object.values(known).map(v=>v[1]).join('|'),prop:'imageinfo',iiprop:'url|extmetadata|size|mime',iiurlwidth:'1000',format:'json'});
let response;
for(let attempt=0;attempt<4;attempt++){
 response=await fetch(url,{headers:{'User-Agent':'ClearConquerEducationalAssets/1.0'},signal:AbortSignal.timeout(30000)});
 if(response.status!==429)break;
 const delay=Math.max(7000,Number(response.headers.get('Retry-After')||7)*1000);
 console.log('Commons requested a pause of '+Math.round(delay/1000)+'s.');
 await new Promise(resolve=>setTimeout(resolve,delay));
}
if(!response.ok)throw Error('Commons '+response.status);
const json=await response.json(),plain=s=>String(s||'').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').trim();
for(const type of ['photo','screenshot']){
 const target=new URL(type==='photo'?'reviewed-photos.json':'reviewed-screenshots.json',tmp);let data={};try{data=JSON.parse(await readFile(target,'utf8'));}catch{}
 for(const [id,[kind,title]] of Object.entries(known)){
  if(kind!==type)continue;
  const page=Object.values(json.query?.pages||{}).find(p=>p.title===title),v=page?.imageinfo?.[0],m=v?.extmetadata;
  if(!v){console.log('Unavailable: '+title);continue;}
  const license=plain(m.LicenseShortName?.value);if(!/CC0|CC BY|Public domain|GPL|MIT|BSD|Apache|MPL/i.test(license))throw Error('Review license: '+title+' '+license);
  data[id]=[{title,url:v.thumburl||v.url,page:v.descriptionurl,artist:plain(m.Artist?.value),license,licenseUrl:m.LicenseUrl?.value||'',description:plain(m.ImageDescription?.value).slice(0,500),width:v.width,height:v.height,mime:v.mime},...(data[id]||[]).filter(p=>p.title!==title)];
  console.log('Reviewed '+id+': '+title);
 }
 await writeFile(target,JSON.stringify(data,null,2));
}

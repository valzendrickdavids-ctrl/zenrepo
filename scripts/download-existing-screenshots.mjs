import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {catalog} from '../src/data/catalog.js';
const tmp=new URL('../../tmp/photo-refresh/',import.meta.url);
const candidates=JSON.parse(await readFile(new URL('screenshot-candidates.json',tmp),'utf8'));
const selections={database:0,wifi:0,bluetooth:0,'world-wide-web':1,email:2,chat:3,'video-call':3,search:1,folder:1,file:0,'text-document':2,'image-file':1,'video-file':5,'audio-file':1,'archive-file':0,download:0,upload:0,save:0,'zoom-in':1,'hide-password':0,'location-pin':1,calendar:1,clock:3,presentation:1,spreadsheet:1,'crop-tool':0,settings:1,terminal:1,'source-code':1,'software-bug':0,'curly-braces':0,hyperlink:1,bookmark:0,notification:1,'user-account':3,help:0,'sign-in':0,'sign-out':1,html:0,css:0,javascript:0,python:0,sql:0,json:2,xml:1,csv:0,variable:1,function:4,recursion:0,algorithm:0,sorting:4,dns:1,dhcp:0,tcp:2,udp:0,vpn:1,proxy:2,'network-switch':2,'access-point':0,'network-port':0,packet:2,'peer-to-peer':4,cookie:0,encryption:2,phishing:1,malware:0,ransomware:0,backup:0,'version-control':0,'git-branch':0,'git-merge':0,'git-commit':0,debugger:2,exception:0,crud:0,'virtual-machine':0,'operating-system':0};
const target=new URL('screenshot-manifest.json',tmp);let manifest={};try{manifest=JSON.parse(await readFile(target,'utf8'));}catch{}
const rejected=new Set(['video-call','hide-password','zoom-in','software-bug','binary']);
for(const id of Object.keys(manifest))if(!(id in selections)||rejected.has(id))delete manifest[id];
for(const [id,index] of Object.entries(selections)){
 if(rejected.has(id))continue;
 const item=candidates[id]?.[index];if(!item){console.log('Not yet found: '+id);continue;}
 if(manifest[id]?.title===item.title)continue;
 let response;
 for(let attempt=0;attempt<4;attempt++){
  response=await fetch(item.url,{headers:{'User-Agent':'ClearConquerEducationalAssets/1.0'},signal:AbortSignal.timeout(45000)});
  if(response.status!==429)break;
  const delay=Math.max(5000,Number(response.headers.get('Retry-After')||5)*1000);console.log(id+': rate limit; pausing '+Math.round(delay/1000)+'s');
  await new Promise(resolve=>setTimeout(resolve,delay));
 }
 if(!response.ok)throw Error('Screenshot download '+id+': '+response.status);
 const bytes=Buffer.from(await response.arrayBuffer()),png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),jpg=bytes[0]===0xff&&bytes[1]===0xd8;
 if(!png&&!jpg)throw Error('Not a raster image: '+id);
 const mode=catalog.find(l=>l.id===id).difficulty,folder={easy:'beginner',medium:'moderate',hard:'expert'}[mode];
 const image='./images/screenshots/'+folder+'/'+id+(png?'.png':'.jpg');
 const destination=new URL('../public/'+image.slice(2),import.meta.url);await mkdir(new URL('.',destination),{recursive:true});await writeFile(destination,bytes);
 manifest[id]={...item,image,kind:['network-switch','access-point'].includes(id)?'photograph':'screenshot',changes:'Existing image; Wikimedia-provided thumbnail.'};
 await writeFile(target,JSON.stringify(manifest,null,2));
 console.log('Downloaded '+id);await new Promise(resolve=>setTimeout(resolve,1500));
}

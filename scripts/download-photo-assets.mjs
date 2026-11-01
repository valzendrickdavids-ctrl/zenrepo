import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {catalog} from '../src/data/catalog.js';
const tmp=new URL('../../tmp/photo-refresh/',import.meta.url);
const candidates=JSON.parse(await readFile(new URL('candidates.json',tmp),'utf8'));
const selections={keyboard:2,mouse:2,monitor:1,cpu:0,ram:0,'hard-drive':0,'usb-drive':1,router:3,ethernet:0,server:0,printer:0,webcam:2,motherboard:1,laptop:0,tablet:0,smartphone:0,headphones:3,microphone:0,speaker:4,'digital-camera':0,scanner:0,gamepad:3,joystick:0,projector:0,'optical-disc':0,'memory-card':0,battery:0,'power-plug':3,'cooling-fan':0,'power-button':4,'ethernet-port':0,'satellite-dish':1,'cell-tower':0,'computer-network':2,lock:3,key:0,fingerprint:1,'qr-code':3,barcode:0,calculator:0};
const manifestFile=new URL('photo-manifest.json',tmp);
let manifest={};try{manifest=JSON.parse(await readFile(manifestFile,'utf8'));}catch{}
for(const [id,index] of Object.entries(selections)){
 const item=candidates[id]?.[index];if(!item){console.log('Pending suitable photo: '+id);continue;}
 if(manifest[id]?.title===item.title)continue;
 const level=catalog.find(l=>l.id===id),folder={easy:'beginner',medium:'moderate',hard:'expert'}[level.difficulty];
 const image='./images/photos/'+folder+'/'+id+'.jpg',dest=new URL('../public/'+image.slice(2),import.meta.url);
 await mkdir(new URL('.',dest),{recursive:true});
 let response;
 for(let attempt=0;attempt<4;attempt++){
  response=await fetch(item.url,{headers:{'User-Agent':'ClearConquerEducationalAssets/1.0'},signal:AbortSignal.timeout(45000)});
  if(response.status!==429)break;
  await new Promise(resolve=>setTimeout(resolve,Math.max(5000,Number(response.headers.get('Retry-After')||5)*1000)));
 }
 if(!response.ok)throw Error('Photo download '+id+': '+response.status);
 const bytes=Buffer.from(await response.arrayBuffer());
 if(bytes[0]!==0xff||bytes[1]!==0xd8)throw Error('Not a JPEG: '+id);
 await writeFile(dest,bytes);
 manifest[id]={...item,image,kind:'photograph',changes:'Wikimedia-provided thumbnail; no semantic edits.'};
 await writeFile(manifestFile,JSON.stringify(manifest,null,2));
 console.log('Downloaded '+id+' ('+Math.round(bytes.length/1024)+' KB)');
 await new Promise(resolve=>setTimeout(resolve,1500));
}

import {mkdir,readFile,writeFile} from 'node:fs/promises';
const dir=new URL('../../tmp/photo-refresh/',import.meta.url);await mkdir(dir,{recursive:true});
const queries={
 keyboard:'computer keyboard',mouse:'computer mouse',monitor:'computer monitor LCD',cpu:'microprocessor chip',ram:'DDR memory module',
 'hard-drive':'hard disk drive open', 'usb-drive':'USB flash drive',router:'wireless router',ethernet:'Ethernet cable RJ45',server:'rack server',
 printer:'desktop printer',webcam:'webcam',motherboard:'computer motherboard',laptop:'laptop computer',tablet:'tablet computer',smartphone:'smartphone',
 headphones:'headphones',microphone:'microphone',speaker:'loudspeaker', 'digital-camera':'digital camera',scanner:'flatbed scanner',gamepad:'gamepad',joystick:'joystick',
 projector:'video projector', 'optical-disc':'compact disc', 'memory-card':'SD memory card',battery:'rechargeable battery', 'power-plug':'electrical power plug',
 'cooling-fan':'computer cooling fan','power-button':'computer power button','ethernet-port':'RJ45 Ethernet port','satellite-dish':'satellite dish','cell-tower':'cellular tower',
 'computer-network':'network rack cables',lock:'padlock',key:'door key',fingerprint:'fingerprint photograph','qr-code':'QR code photograph',barcode:'barcode product photograph',calculator:'electronic calculator'
};
const target=new URL('candidates.json',dir);
let result={};try{result=JSON.parse(await readFile(target,'utf8'));}catch{}
const plain=s=>String(s||'').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').trim();
const entries=Object.entries(queries).filter(([id])=>!result[id]);
for(let i=0;i<entries.length;i++){
 await Promise.all(entries.slice(i,i+1).map(async([id,q])=>{
  const url=new URL('https://commons.wikimedia.org/w/api.php');
  url.search=new URLSearchParams({action:'query',generator:'search',gsrsearch:q+' filetype:bitmap',gsrnamespace:'6',gsrlimit:'8',prop:'imageinfo',iiprop:'url|extmetadata|size|mime',iiurlwidth:'1000',format:'json'});
  let response;
  for(let retry=0;retry<4;retry++){
   response=await fetch(url,{headers:{'User-Agent':'ClearConquerEducationalAssets/1.0'},signal:AbortSignal.timeout(30000)});
   if(response.status!==429)break;
   await new Promise(resolve=>setTimeout(resolve,Math.max(5000,Number(response.headers.get('Retry-After')||5)*1000)));
  }
  if(!response.ok)throw Error('Commons '+response.status);
  const json=await response.json();
  result[id]=Object.values(json.query?.pages||{}).sort((a,b)=>a.index-b.index).flatMap(p=>{
   const v=p.imageinfo?.[0],m=v?.extmetadata;if(!v||v.mime!=='image/jpeg'||v.width<500||v.height<300)return [];
   const license=plain(m?.LicenseShortName?.value);if(!/CC0|CC BY|Public domain/i.test(license))return [];
   return [{title:p.title,url:v.thumburl||v.url,page:v.descriptionurl,artist:plain(m.Artist?.value),license,licenseUrl:m.LicenseUrl?.value||'',description:plain(m.ImageDescription?.value).slice(0,260),width:v.width,height:v.height}];
  });
  console.log(id+': '+result[id].map((v,j)=>j+'='+v.title).join(' | '));
 }));
 await writeFile(target,JSON.stringify(result,null,2));
 await new Promise(resolve=>setTimeout(resolve,1500));
}

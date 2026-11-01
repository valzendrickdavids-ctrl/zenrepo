import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {catalog} from '../src/data/catalog.js';
const tmp=new URL('../../tmp/photo-refresh/',import.meta.url);await mkdir(tmp,{recursive:true});
const photos=JSON.parse(await readFile(new URL('candidates.json',tmp),'utf8'));
const target=new URL('screenshot-candidates.json',tmp);let results={};try{results=JSON.parse(await readFile(target,'utf8'));}catch{}
const queries={
 database:'database management screenshot',firewall:'firewall settings screenshot',cloud:'cloud computing dashboard screenshot',binary:'binary editor screenshot',flowchart:'flowchart editor screenshot',
 wifi:'Wi-Fi settings screenshot',bluetooth:'Bluetooth settings screenshot','world-wide-web':'web browser screenshot',email:'email client screenshot',chat:'instant messaging screenshot','video-call':'video conferencing screenshot',search:'search engine screenshot',
 folder:'file manager folders screenshot',file:'file manager screenshot','text-document':'text editor screenshot','image-file':'image viewer screenshot','video-file':'video player screenshot','audio-file':'audio player screenshot','archive-file':'archive manager screenshot','recycle-bin':'trash file manager screenshot',
 download:'download manager screenshot',upload:'file upload dialog screenshot',save:'save file dialog screenshot',copy:'copy paste context menu screenshot',cut:'cut paste file screenshot',clipboard:'clipboard manager screenshot',undo:'undo edit menu screenshot',redo:'redo edit menu screenshot','zoom-in':'zoom image editor screenshot','zoom-out':'zoom out image editor screenshot',
 'security-shield':'antivirus application screenshot','hide-password':'password field screenshot','location-pin':'map application screenshot',calendar:'calendar application screenshot',clock:'clock application screenshot',presentation:'LibreOffice Impress screenshot',spreadsheet:'LibreOffice Calc screenshot','bar-chart':'bar chart spreadsheet screenshot',paintbrush:'GIMP paintbrush screenshot','pencil-tool':'GIMP pencil tool screenshot','color-palette':'GIMP color palette screenshot','crop-tool':'GIMP crop screenshot',settings:'application settings screenshot',terminal:'terminal emulator screenshot','source-code':'source code editor screenshot','software-bug':'software error dialog screenshot','curly-braces':'C source code editor screenshot','square-brackets':'array source code screenshot',hyperlink:'web hyperlink screenshot',bookmark:'browser bookmarks screenshot',notification:'desktop notification screenshot','user-account':'user account settings screenshot','user-group':'user groups permissions screenshot',contacts:'contacts application screenshot',refresh:'browser reload screenshot',help:'help dialog screenshot',information:'information dialog screenshot','sign-in':'login form screenshot','sign-out':'logout screenshot',shutdown:'shutdown dialog screenshot',
 html:'HTML editor screenshot',css:'CSS editor screenshot',javascript:'JavaScript editor screenshot',python:'Python IDLE screenshot',sql:'SQL query editor screenshot',json:'JSON editor screenshot',xml:'XML editor screenshot',csv:'CSV editor screenshot',
 'git-branch':'Git branches screenshot','git-merge':'Git merge screenshot','git-commit':'Git commit screenshot','version-control':'Git repository screenshot','operating-system':'Linux desktop screenshot',container:'Docker containers screenshot','virtual-machine':'VirtualBox running screenshot','network-switch':'network switch photograph','access-point':'wireless access point photograph',backup:'backup application screenshot',vpn:'VPN client screenshot',cache:'browser cache screenshot',cookie:'browser cookies screenshot',session:'browser session screenshot',debugger:'debugger screenshot','unit-test':'unit testing results screenshot',api:'API client screenshot','primary-key':'database table primary key screenshot','foreign-key':'database foreign key screenshot','database-index':'database index screenshot',transaction:'database transaction screenshot',normalization:'database normalization application screenshot','query-plan':'database explain query plan screenshot',
};
const plain=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim();
let done=0;
for(const level of catalog.filter(l=>!photos[l.id]&&!results[l.id])){
 const q=queries[level.id]||level.answer+' software screenshot';
 const url=new URL('https://commons.wikimedia.org/w/api.php');
 url.search=new URLSearchParams({action:'query',generator:'search',gsrsearch:q+' filetype:bitmap',gsrnamespace:'6',gsrlimit:'6',prop:'imageinfo',iiprop:'url|extmetadata|size|mime',iiurlwidth:'1000',format:'json'});
 let response;
 for(let retry=0;retry<4;retry++){
  response=await fetch(url,{headers:{'User-Agent':'ClearConquerEducationalAssets/1.0'},signal:AbortSignal.timeout(30000)});
  if(response.status!==429)break;
  console.log('Respecting Commons request limit');
  await new Promise(resolve=>setTimeout(resolve,Math.max(7000,Number(response.headers.get('Retry-After')||7)*1000)));
 }
 if(!response.ok)throw Error('Commons '+response.status);
 const json=await response.json();
 results[level.id]=Object.values(json.query?.pages||{}).sort((a,b)=>a.index-b.index).flatMap(page=>{
  const v=page.imageinfo?.[0],m=v?.extmetadata;if(!v||!['image/jpeg','image/png'].includes(v.mime)||v.width<450||v.height<280)return [];
  const license=plain(m?.LicenseShortName?.value);if(!/CC0|CC BY|Public domain|GPL|MIT|BSD|Apache|MPL|Free Art/i.test(license))return [];
  return [{title:page.title,url:v.thumburl||v.url,page:v.descriptionurl,artist:plain(m.Artist?.value),license,licenseUrl:m.LicenseUrl?.value||'',description:plain(m.ImageDescription?.value).slice(0,500),categories:plain(m.Categories?.value),width:v.width,height:v.height,mime:v.mime}];
 });
 await writeFile(target,JSON.stringify(results,null,2));
 console.log(level.id+': '+results[level.id].map((v,j)=>j+'='+v.title).join(' | '));
 done++;await new Promise(resolve=>setTimeout(resolve,1700));
}
console.log('Looked up '+done+' additional concepts.');

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as icons from 'lucide-react';
import { catalog } from '../src/data/catalog.js';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const stroke='#24445e',ink='#19334a',accent='#2e86de';
function wrap(value,max=24){
 const out=[];let line='';
 for(const word of String(value).split(/\s+/)){
  if((line+' '+word).trim().length>max&&line){out.push(line);line='';}
  if(word.length>max){if(line){out.push(line);line='';}for(let i=0;i<word.length;i+=max)out.push(word.slice(i,i+max));}
  else line+=(line?' ':'')+word;
 }
 if(line)out.push(line);return out;
}
function text(x,y,value,{size=17,width=440,color=ink,anchor='middle',mono=false}={}){
 const lines=Array.isArray(value)?value:wrap(value,Math.max(6,Math.floor(width/(size*.58))));
 const top=y-(lines.length-1)*size*.63;
 return '<text x="'+x+'" y="'+top+'" text-anchor="'+anchor+'" fill="'+color+'" font-size="'+size+'" font-family="'+(mono?'Consolas, monospace':'Arial, sans-serif')+'">'+lines.map((l,i)=>'<tspan x="'+x+'" dy="'+(i?size*1.26:0)+'">'+esc(l)+'</tspan>').join('')+'</text>';
}
const rect=(x,y,w,h,fill='#fff',radius=12)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+radius+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="2"/>';
const line=(x1,y1,x2,y2,arrow=true)=>'<path d="M'+x1+' '+y1+' L'+x2+' '+y2+'" fill="none" stroke="'+stroke+'" stroke-width="3"'+(arrow?' marker-end="url(#arrow)"':'')+'/>';
function box(x,y,w,h,label,fill='#fff'){return rect(x,y,w,h,fill)+text(x+w/2,y+h/2+5,label,{width:w-16,size:w<130?14:17});}
function render(level){
 const {type,payload=[]}=level.visual, labels=(payload[0]||'').split(';').filter(Boolean);
 if(type==='icon'){
  if(level.id==='usb-drive')return '<g transform="rotate(-22 300 200)"><rect x="110" y="135" width="285" height="130" rx="32" fill="#2e86de" stroke="#24445e" stroke-width="5"/><rect x="395" y="155" width="105" height="90" rx="4" fill="#cbdce9" stroke="#24445e" stroke-width="5"/><rect x="420" y="169" width="23" height="20" fill="#24445e"/><rect x="420" y="211" width="23" height="20" fill="#24445e"/><circle cx="155" cy="200" r="15" fill="#d8edff" stroke="#24445e" stroke-width="4"/></g>';
  if(level.id==='ethernet')return '<path d="M80 320 C140 70 350 390 420 190" fill="none" stroke="#2e86de" stroke-width="28"/><g transform="rotate(18 420 150)"><rect x="375" y="75" width="90" height="140" rx="7" fill="#bed9ec" stroke="#24445e" stroke-width="5"/><rect x="395" y="52" width="50" height="24" fill="#bed9ec" stroke="#24445e" stroke-width="4"/>'+Array.from({length:8},(_,i)=>'<path d="M'+(384+i*10)+' 95 V150" stroke="#d5a343" stroke-width="5"/>').join('')+'</g>';
  if(level.id==='memory-card')return '<path d="M210 70 H350 L390 110 V330 H210Z" fill="#345975" stroke="#19334a" stroke-width="5"/><rect x="232" y="155" width="136" height="120" rx="8" fill="#9ec9e9"/>'+Array.from({length:7},(_,i)=>'<rect x="'+(230+i*20)+'" y="88" width="12" height="45" fill="#e6c078"/>').join('');
  const Icon=icons[level.icon];
  if(!Icon)throw Error('Missing icon '+level.icon);
  const svg=renderToStaticMarkup(React.createElement(Icon,{size:228,strokeWidth:1.35,color:stroke}));
  return '<circle cx="300" cy="200" r="148" fill="#d4e8f9"/><circle cx="300" cy="200" r="120" fill="#f7fbff"/><g transform="translate(186 86)">'+svg+'</g>';
 }
 if(type==='code'){
  let rows=labels;
  if(level.id==='loop')rows=['for (let i = 0; i < 4; i++) {','  drawPixel(i);','}'];
  if(level.id==='css')rows=['.card {','  color: blue;','  padding: 16px;','  border-radius: 8px;','}'];
  rows=rows.flatMap(r=>wrap(r,49));
  const size=Math.min(18,270/(rows.length+1));
  return rect(35,40,530,320,'#19334a')+'<circle cx="58" cy="62" r="5" fill="#ef8b87"/><circle cx="76" cy="62" r="5" fill="#eac46d"/><circle cx="94" cy="62" r="5" fill="#7cceb3"/>'+rows.map((l,i)=>text(56,105+i*(size*1.38),[l],{size,anchor:'start',color:'#c8f0ee',mono:true})).join('');
 }
 if(type==='nodes'){
  const h=Math.min(56,270/labels.length),gap=14,total=labels.length*h+(labels.length-1)*gap,top=(400-total)/2;
  return labels.map((l,i)=>(i?line(300,top+(i-1)*(h+gap)+h,300,top+i*(h+gap)-4):'')+box(90,top+i*(h+gap),420,h,l,i%2?'#d4e8f9':'#fff')).join('');
 }
 if(type==='tiles'){
  const h=Math.min(82,280/labels.length),gap=12,top=(400-labels.length*h-(labels.length-1)*gap)/2;
  return labels.map((l,i)=>box(55,top+i*(h+gap),490,h,l,i%2?'#d4e8f9':'#fff')).join('');
 }
 if(type==='array'){
  const w=500/labels.length;
  return labels.map((l,i)=>box(50+i*w,150,w-5,90,l,'#d4e8f9')+text(50+i*w+w/2,273,String(i),{size:14})).join('');
 }
 if(type==='table'){
  const rows=labels.map(l=>l.split(',')),cols=Math.max(...rows.map(r=>r.length)),w=510/cols,h=Math.min(52,280/rows.length),top=(400-rows.length*h)/2;
  return rows.map((row,r)=>row.map((l,c)=>rect(45+c*w,top+r*h,w,h,r?'#fff':'#bedcf4',0)+text(45+c*w+w/2,top+r*h+h/2+5,l,{width:w-15,size:15})).join('')).join('');
 }
 if(type==='stack'){
  const h=58,top=(400-labels.length*h)/2;
  return labels.map((l,i)=>box(120,top+i*h,360,h-5,l,i%2?'#d4e8f9':'#fff')).join('');
 }
 if(type==='decision'){
  return '<path d="M300 60 L465 150 L300 240 L135 150Z" fill="#f8dfab" stroke="'+stroke+'" stroke-width="3"/>'+text(300,153,labels[0],{width:210})+
  line(210,195,160,280)+line(390,195,440,280)+box(40,285,240,65,labels[1],'#d6eddf')+box(320,285,240,65,labels[2],'#f4d9dc');
 }
 if(type==='sequence'){
  const [a,b,messages]=payload,ms=messages.split(';'),step=235/ms.length;
  return box(50,30,180,48,a)+box(370,30,180,48,b)+line(140,85,140,355,false)+line(460,85,460,355,false)+ms.map((label,i)=>{
   const forward=level.id==='udp'?true:level.id==='http'?i===0:i%2===0,y=120+i*step;
   return line(forward?145:455,y,forward?450:150,y)+text(300,y-13,label,{size:14,width:295});
  }).join('');
 }
 if(type==='tree'||type==='coloredtree'){
  let positions=labels.map((_,i)=>i===0?[300,75]:i<3?[i===1?160:440,185]:[75+(i-3)*150,300]);
  let parents=labels.map((_,i)=>Math.floor((i-1)/2));
  if(level.id==='b-tree'){positions=[[300,90],[105,275],[300,275],[495,275]];parents=[-1,0,0,0];}
  return labels.map((_,i)=>i?line(positions[parents[i]][0],positions[parents[i]][1]+22,positions[i][0],positions[i][1]-28):'').join('')+
   labels.map((label,i)=>{
    const [x,y]=positions[i];
    if(type==='coloredtree'){const [v,c]=label.split(':');return '<circle cx="'+x+'" cy="'+y+'" r="30" fill="'+(c==='R'?'#bc4154':'#243c51')+'"/>'+text(x,y+6,v,{color:'#fff',size:21});}
    return box(x-66,y-28,132,56,label,'#d4e8f9');
   }).join('');
 }
 if(['star','ring','mesh','triangle','bus'].includes(type)){
  let ps;
  if(type==='star')ps=labels.map((_,i)=>i===0?[300,200]:[300+200*Math.cos((i-1)*2*Math.PI/(labels.length-1)-Math.PI/2),200+135*Math.sin((i-1)*2*Math.PI/(labels.length-1)-Math.PI/2)]);
  else if(type==='bus')ps=labels.map((_,i)=>[75+i*450/(labels.length-1),120]);
  else ps=labels.map((_,i)=>[300+205*Math.cos(i*2*Math.PI/labels.length-Math.PI/2),200+135*Math.sin(i*2*Math.PI/labels.length-Math.PI/2)]);
  let edges='';
  if(type==='bus')edges=line(40,240,560,240,false)+ps.map(p=>line(p[0],p[1]+30,p[0],240,false)).join('');
  else if(type==='star')edges=ps.slice(1).map(p=>line(300,200,p[0],p[1],false)).join('');
  else if(type==='mesh')edges=ps.map((p,i)=>ps.slice(i+1).map(q=>line(...p,...q,false)).join('')).join('');
  else edges=ps.map((p,i)=>line(...p,...ps[(i+1)%ps.length],false)).join('');
  return edges+ps.map((p,i)=>box(p[0]-62,p[1]-30,124,60,labels[i],i%2?'#fff':'#d4e8f9')).join('');
 }
 if(type==='fork'||type==='merge'){
  const ps=type==='fork'?[[70,140],[210,140],[390,140],[300,280],[480,280]]:[[70,200],[220,100],[220,300],[390,200],[530,200]];
  const pairs=type==='fork'?[[0,1],[1,2],[1,3],[3,4]]:[[0,1],[0,2],[1,3],[2,3],[3,4]];
  return pairs.map(([a,b])=>line(...ps[a],...ps[b],false)).join('')+ps.map((p,i)=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="27" fill="'+(i%2?'#d4e8f9':'#fff')+'" stroke="'+stroke+'" stroke-width="3"/>'+text(p[0],p[1]+6,labels[i],{size:19})).join('');
 }
 if(type==='weighted'){
  const ps=[[90,200],[280,80],[280,320],[510,200]],pairs=[[0,1],[0,2],[1,2],[1,3],[2,3]];
  return pairs.map(([a,b],i)=>{const p=ps[a],q=ps[b];return line(...p,...q,false)+text((p[0]+q[0])/2+12,(p[1]+q[1])/2-12,labels[4+i],{size:18});}).join('')+ps.map((p,i)=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="27" fill="#fff" stroke="'+stroke+'" stroke-width="3"/>'+text(p[0],p[1]+6,labels[i])).join('');
 }
 if(type==='curves')return line(80,325,550,325)+line(80,325,80,35)+
  '<path d="M80 320 Q130 260 520 240" fill="none" stroke="#2e86de" stroke-width="4"/><path d="M80 320 L510 80" fill="none" stroke="#b56c22" stroke-width="4"/><path d="M80 320 Q330 300 470 45" fill="none" stroke="#9a55ad" stroke-width="4"/><path d="M80 320 Q290 320 335 35" fill="none" stroke="#c54c60" stroke-width="4"/>'+
  text(510,230,'log n',{size:16})+text(530,85,'n',{size:16})+text(475,35,'n log n',{size:16})+text(320,25,'n²',{size:16})+text(315,375,'Input size →',{size:16});
 throw Error('Unknown diagram type: '+type);
}
const directory=new URL('../public/images/',import.meta.url);
for(const level of catalog){
 const relative=level.image.replace('./images/','');
 const destination=new URL(relative,directory);await mkdir(new URL('.',destination),{recursive:true});
 const art='<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10Z" fill="'+stroke+'"/></marker></defs><rect width="600" height="400" fill="#edf5fd"/>'+render(level)+'</svg>\n';
 await writeFile(destination,art);
}
console.log('Generated '+catalog.length+' SVG assets: 100 Beginner, 75 Moderate, 50 Expert.');


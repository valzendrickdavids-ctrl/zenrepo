import { useEffect, useRef, useState } from 'react';
import { BrushEngine, CELL, COLS, WIDTH, HEIGHT, STROKE_LIMIT } from '../lib/brushEngine.js';
export default function PrecisionCanvas({ image, saved, brush, attempts, disabled, onChange, audio }) {
 const canvas=useRef(null),cover=useRef(null),recoveryTimer=useRef(0),engine=useRef(null);
 const callbacks=useRef({onChange,audio,disabled});callbacks.current={onChange,audio,disabled};
 if(!engine.current)engine.current=new BrushEngine(attempts,saved);
 const [status,setStatus]=useState('Ready to brush');
 function paint(ctx){
  ctx.fillStyle='#264b70';ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.fillStyle='#365f85';
  for(let y=0;y<HEIGHT;y+=24)for(let x=0;x<WIDTH;x+=24){ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 25px sans-serif';ctx.fillText('WHAT’S UNDER HERE?',300,185);
  ctx.font='16px sans-serif';ctx.fillText('One stroke. Up to 7%. Make it count.',300,218);
 }
 function publish(){callbacks.current.onChange(engine.current.snapshot());}
 function recover(){
  clearTimeout(recoveryTimer.current);
  const m=engine.current,remaining=m.recoveryUntil-Date.now();
  // Keep the holes fully visible until the deadline, then cover in one step.
  if(cover.current)cover.current.style.opacity=remaining>0?'0':'1';
  if(remaining>0){setStatus('Cover returns in 2 seconds — brush locked');recoveryTimer.current=setTimeout(recover,remaining);}
  else setStatus(m.used>=attempts?'No brushes left — make your guess':'Ready to brush');
 }
 function end(pointer){if(!engine.current.end(pointer,Date.now()))return;callbacks.current.audio.stopScratch();publish();recover();}
 useEffect(()=>{
  const ctx=canvas.current.getContext('2d');paint(ctx);paint(cover.current.getContext('2d'));
  engine.current.stroke.forEach(n=>ctx.clearRect(n%COLS*CELL,Math.floor(n/COLS)*CELL,CELL,CELL));
  publish();recover();
  const stop=()=>end(engine.current.pointer),hidden=()=>{if(document.hidden)stop();else if(!engine.current.active)recover();};
  window.addEventListener('blur',stop);document.addEventListener('visibilitychange',hidden);
  return()=>{clearTimeout(recoveryTimer.current);callbacks.current.audio.stopScratch();window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',hidden);};
 },[]);
 useEffect(()=>{if(disabled){end(engine.current.pointer);callbacks.current.audio.stopScratch();}},[disabled]);
 function start(pointer){
  if(callbacks.current.disabled||!engine.current.start(pointer,Date.now()))return false;
  paint(canvas.current.getContext('2d'));cover.current.style.opacity='0';clearTimeout(recoveryTimer.current);
  callbacks.current.audio.startScratch();setStatus('Brushing — maximum 7%');publish();return true;
 }
 function move(pointer,x,y){
  if(callbacks.current.disabled)return;
  const added=engine.current.move(pointer,x,y,brush,Date.now()),ctx=canvas.current.getContext('2d');
  added.forEach(n=>ctx.clearRect(n%COLS*CELL,Math.floor(n/COLS)*CELL,CELL,CELL));
  if(engine.current.stroke.size===STROKE_LIMIT){setStatus('7% reached — release to recover');callbacks.current.audio.stopScratch();}
  if(added.length)publish();
 }
 function point(e){const r=canvas.current.getBoundingClientRect();return [(e.clientX-r.left)*WIDTH/r.width,(e.clientY-r.top)*HEIGHT/r.height];}
 return <><div className="scratch-board">
  <img src={image} alt={disabled?'Revealed IT illustration':'Hidden visual clue'} draggable="false"/>
  <canvas ref={canvas} width={WIDTH} height={HEIGHT} hidden={disabled} tabIndex={disabled?-1:0}
   aria-label="Scratch clue. Hold and release Space for one brush attempt, or drag with mouse or touch."
   onPointerDown={e=>{if(e.button!==0||!start(e.pointerId))return;e.currentTarget.setPointerCapture(e.pointerId);move(e.pointerId,...point(e));}}
   onPointerMove={e=>{if(engine.current.active&&engine.current.pointer===e.pointerId)move(e.pointerId,...point(e));}}
   onPointerUp={e=>end(e.pointerId)} onPointerCancel={e=>end(e.pointerId)} onLostPointerCapture={e=>end(e.pointerId)}
   onBlur={()=>end(engine.current.pointer)}
   onKeyDown={e=>{if(e.code==='Space'){e.preventDefault();if(!e.repeat&&start('keyboard'))move('keyboard',Math.random()*WIDTH,Math.random()*HEIGHT);}}}
   onKeyUp={e=>{if(e.code==='Space'){e.preventDefault();end('keyboard');}}}/>
  <canvas ref={cover} width={WIDTH} height={HEIGHT} hidden={disabled} className="recovery-cover" aria-hidden="true"/>
 </div><p className="brush-status" role="status">{disabled?'Round finished':status}</p></>;
}


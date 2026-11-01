import {memo,useEffect,useState} from 'react';

const particles=[
  [7,19,2,19],[16,73,3,24],[25,40,2,21],[34,87,2,27],
  [43,12,3,25],[53,64,2,23],[63,29,2,28],[73,81,3,22],
  [82,49,2,26],[93,17,2,20],[89,92,2,29],[5,51,2,30],
];

export default memo(function AmbientBackground({calm=false}){
  const [hidden,setHidden]=useState(()=>document.hidden);
  useEffect(()=>{
    const changed=()=>setHidden(document.hidden);
    document.addEventListener('visibilitychange',changed);
    return()=>document.removeEventListener('visibilitychange',changed);
  },[]);
  return <div className={'ambient-background'+(calm?' ambient-calm':'')+(hidden?' ambient-paused':'')} aria-hidden="true">
    <div className="ambient-glow"/>
    <div className="ambient-particles">{particles.map(([x,y,size,duration],i)=><i key={i} style={{left:`${x}%`,top:`${y}%`,width:size+1,height:size+1,'--particle-duration':`${duration}s`,'--particle-delay':`${-i*2}s`,'--particle-drift':`${i%2?24:-24}px`}}/>)}</div>
  </div>;
});

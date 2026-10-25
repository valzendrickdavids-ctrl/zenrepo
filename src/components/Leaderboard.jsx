import { useEffect, useState } from 'react';
import { leaderboard } from '../lib/storage.js';
import { difficulties } from '../lib/engine.js';
export default function Leaderboard({ demo, difficulty, compact=false, refresh=0 }) {
  const [rows,setRows]=useState([]), [status,setStatus]=useState('Loading scores…');
  useEffect(()=>{let active=true;setRows([]);setStatus('Loading scores…');leaderboard(demo,difficulty).then(data=>{if(active){setRows(data);setStatus(data.length?'':'No saved scores in this difficulty yet.');}}).catch(e=>{if(active)setStatus(e.message);});return()=>{active=false;};},[demo,difficulty,refresh]);
  const mode=difficulties[difficulty];
  return <section className="panel leaderboard" aria-label={`${mode.label} leaderboard`} style={{'--mode':mode.color}}><div className="row spread"><h2>{mode.label} leaderboard</h2><span className="eyebrow">{demo?'THIS DEVICE':'ONLINE'}</span></div>
    <p className="small muted">Best saved score per player · {mode.label} only</p>
    {status && <p className="muted" role="status">{status}</p>}
    <ol>{rows.slice(0,compact?5:20).map((r,i)=><li key={i}><span className="rank">{String(i+1).padStart(2,'0')}</span><span>{r.display_name}</span><strong>{r.best_score.toLocaleString()}</strong></li>)}</ol>
  </section>;
}


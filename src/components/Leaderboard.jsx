import { useEffect, useRef, useState } from 'react';
import { leaderboard } from '../lib/storage.js';
import { difficulties } from '../lib/engine.js';
import { watchLeaderboard } from '../lib/leaderboardRefresh.js';
const medals = [
  { symbol:'🥇', label:'1st place — Gold medal' },
  { symbol:'🥈', label:'2nd place — Silver medal' },
  { symbol:'🥉', label:'3rd place — Bronze medal' },
];
function Rank({place}) {
  const medal=medals[place-1];
  return medal
    ? <span className="rank rank-medal" role="img" aria-label={medal.label} title={medal.label}>{medal.symbol}</span>
    : <span className="rank">{String(place).padStart(2,'0')}</span>;
}
export default function Leaderboard({ difficulty, compact=false, refresh=0, visibleRows=0 }) {
  const [rows,setRows]=useState([]), [status,setStatus]=useState('Loading scores…');
  const [refreshError,setRefreshError]=useState('');
  const previous=useRef({difficulty,rows:[]});
  useEffect(()=>{
    if(previous.current.difficulty!==difficulty){previous.current={difficulty,rows:[]};setRows([]);setStatus('Loading scores…');setRefreshError('');}
    return watchLeaderboard({
      load:signal=>leaderboard(difficulty,signal),
      onData:data=>{previous.current={difficulty,rows:data};setRows(data);setStatus(data.length?'':'No saved scores in this difficulty yet.');setRefreshError('');},
      onError:error=>{setRefreshError(error.message);if(!previous.current.rows.length)setStatus('Scores could not refresh. Retrying automatically.');}
    });
  },[difficulty,refresh]);
  const mode=difficulties[difficulty];
  return <section className="panel leaderboard" aria-label={`${mode.label} leaderboard`} style={{'--mode':mode.color,'--leaderboard-visible-rows':visibleRows|| (compact?5:6)}}><div className="row spread"><h2>{mode.label} leaderboard</h2><span className="eyebrow" role="status" title={refreshError?'Scores could not refresh. Retrying automatically.':'Scores refresh automatically every 10 seconds.'} aria-label={refreshError?'Leaderboard update failed; retrying automatically':'Online leaderboard; updates automatically'}>{refreshError?'RETRY':'ONLINE'}</span></div>
    <p className="small muted leaderboard-caption">Best saved score per player</p>
    <div className="leaderboard-scores">
      {status && <p className="muted leaderboard-status" role="status">{status}</p>}
      {rows.length>0&&<ol className="leaderboard-list" tabIndex={0} aria-label={`${mode.label} player rankings`}>{rows.map((r,i)=><li key={i}><Rank place={i+1}/><span title={r.display_name}>{r.display_name}</span><strong>{r.best_score.toLocaleString()}</strong></li>)}</ol>}
    </div>
  </section>;
}


import {scoreSnapshot} from './scoreAudit.js';
const key=user=>'cc-score-queue-'+user.id;
const valid=row=>row&&typeof row.id==='string'&&['easy','medium','hard'].includes(row.difficulty)&&Number.isSafeInteger(row.score)&&row.score>=0;
export function pendingScores(user){
  try{const rows=JSON.parse(localStorage.getItem(key(user))||'[]');return Array.isArray(rows)?rows.filter(valid):[];}catch{return [];}
}
function write(user,rows){try{localStorage.setItem(key(user),JSON.stringify(rows));return true;}catch{return false;}}
export function queueScore(user,run){
  if(!user?.id||!valid(run))return false;
  const rows=pendingScores(user),previous=rows.find(r=>r.id===run.id&&r.difficulty===run.difficulty);
  if(previous){if(run.score>=previous.score)Object.assign(previous,scoreSnapshot(run));}
  else rows.push(scoreSnapshot(run));
  return write(user,rows);
}
export function acknowledgeScore(user,run){
  return write(user,pendingScores(user).filter(r=>r.id!==run.id||r.difficulty!==run.difficulty||r.score>run.score));
}
export function clearPendingScores(user){localStorage.removeItem(key(user));}
const running=new Map();
export function waitForScoreUploads(user){return running.get(user.id)||Promise.resolve();}
export function flushScoreQueue(user,submit,isCurrent=()=>true){
  if(running.has(user.id))return running.get(user.id);
  const task=(async()=>{
    let uploaded=0,error='';
    for(const run of pendingScores(user)){
      if(!isCurrent())break;
      try{await submit(user,run);if(!acknowledgeScore(user,run))throw Error('Could not update the saved score queue.');uploaded++;}
      catch(e){error=e.message;break;}
    }
    return {uploaded,remaining:pendingScores(user).length,error};
  })().finally(()=>running.delete(user.id));
  running.set(user.id,task);return task;
}

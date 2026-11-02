import {ANSWER_RULES_VERSION} from './answerRules.js';
// Keep answer history with the run so an offline retry can be checked by the server.
export function withScoreAudit(run) {
  if(!run||run.scoreAudit)return run;
  return {...run,scoreAudit:{version:1,baseIndex:run.phase==='complete'?run.order.length:run.index+(run.phase==='answered'?1:0),baseScore:run.score,baseCorrect:run.correct||0,events:[]}};
}
export function recordScoreAnswer(run,guess,remaining) {
  const next=withScoreAudit(run);
  return {...next,scoreAudit:{...next.scoreAudit,events:[...next.scoreAudit.events,{index:next.index,guess,remaining:Math.round(remaining*1000)/1000,rulesVersion:ANSWER_RULES_VERSION}]}};
}
export function scoreSnapshot(run) {
  const snapshot={id:run.id,difficulty:run.difficulty,score:run.score};
  // Old queued scores may have only these three fields. The server accepts them
  // only when they match a frozen, pre-upgrade baseline, never as new points.
  if(!Array.isArray(run.order))return snapshot;
  const audited=withScoreAudit(run);
  return {...snapshot,order:[...run.order],index:run.index,phase:run.phase,correct:run.correct||0,scoreAudit:structuredClone(audited.scoreAudit)};
}

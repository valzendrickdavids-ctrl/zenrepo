import { validDifficulty } from './rankings.js';

export function withoutSavedRuns(run) {
  if (!run) return null;
  const {savedRuns, ...state}=run;
  return state;
}

// Accept the old single-run save as well as the newer per-difficulty collection.
export function mergeRunSaves(...states) {
  const runs={};
  for (const state of states) {
    const candidates=Object.entries(state?.savedRuns||{})
      .filter(([difficulty,run])=>run?.difficulty===difficulty).map(([,run])=>run);
    candidates.push(state);
    for (const run of candidates) {
      if (!run?.id||!validDifficulty(run.difficulty)) continue;
      const previous=runs[run.difficulty];
      if (!previous||(run.updatedAt??0)>=(previous.updatedAt??0))
        runs[run.difficulty]=withoutSavedRuns(run);
    }
  }
  return runs;
}

export function withSavedRuns(run,...states) {
  const savedRuns=mergeRunSaves(...states,run);
  return {...savedRuns[run.difficulty],savedRuns};
}

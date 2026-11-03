import { supabase } from './supabase.js';
import { validDifficulty } from './rankings.js';
import {scoreSnapshot} from './scoreAudit.js';
import { withSavedRuns } from './runSaves.js';
import {loadWithDeadline,PROGRESS_MIN_LOAD_MS} from './loadDeadline.js';
export const readLocal = (key, fallback = null) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
export function writeLocal(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
const runKey = user => 'cc-run-' + user.id;
export async function loadRun(user) {
  const local = readLocal(runKey(user));
  if (!supabase) throw Error('Account service is unavailable. Please try again later.');
  const { data, error } = await loadWithDeadline(
    signal=>supabase.from('game_runs').select('state').eq('user_id', user.id).maybeSingle().abortSignal(signal),
    {minimumMs:PROGRESS_MIN_LOAD_MS,timeoutMessage:'Cloud progress did not respond within 10 seconds.'}
  );
  if (error) throw new Error('Cloud progress could not load. Check your connection and database setup.');
  const remote = data?.state;
  const current=!remote || (local?.updatedAt ?? 0) > (remote.updatedAt ?? 0) ? local : remote;
  return current?withSavedRuns(current,remote,local):null;
}
export function cacheRun(user, run) { return writeLocal(runKey(user), withSavedRuns(run,readLocal(runKey(user)))); }
export async function saveCloud(user, run) {
  if (!supabase || !user?.id) throw Error('Sign in to save your progress online.');
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
  try{
    const state=withSavedRuns(run,readLocal(runKey(user)));
    const { error } = await supabase.from('game_runs').upsert({ user_id: user.id, state, updated_at: new Date().toISOString() }).abortSignal(controller.signal);
    if (error) throw new Error('Cloud save failed. Progress is still saved on this device.');
  }finally{clearTimeout(timeout);}
}
export async function submitScore(user, run) {
  if (!validDifficulty(run.difficulty)) throw Error('Score has no valid difficulty. Start a new run.');
  if (!supabase || !user?.id) throw Error('Sign in to save your leaderboard score.');
  if(!Number.isSafeInteger(run.score)||run.score<0)throw Error('The leaderboard score must be a nonnegative whole number.');
  {
    const {error}=await loadWithDeadline(signal=>supabase.rpc('submit_verified_score',{p_run:scoreSnapshot(run)}).abortSignal(signal),{timeoutMessage:'Progress is saved on this device. The leaderboard request timed out. You can retry or quit with a local save.'});
    if (error) {
      const code=/^[A-Z0-9]{4,12}$/.test(error.code||'')?error.code:'';
      const reason=error.name==='AbortError'?'The leaderboard request timed out.':
        code==='42501'?'The database denied permission to save this score.':
        ['PGRST301','PGRST302','PGRST303'].includes(code)?'Your online session needs to be renewed.':
        ['42P10','42P01','42703','PGRST204','PGRST205'].includes(code)?'The online leaderboard database setup is incomplete.':
        code==='23503'?'The database could not link this score to its required account or record.':
        code==='23514'?'The score did not match its verified answer history. Older unverified points remain in your local save; start a fresh run to earn verified points.':
        !code?'The leaderboard service could not be reached.':'The leaderboard service rejected this score.';
      throw new Error(`Progress is saved on this device. ${reason}${code?` Error code: ${code}.`:''} Your score has not been uploaded.`);
    }
  }
}
export async function leaderboard(difficulty,signal) {
  if (!validDifficulty(difficulty)) throw new Error('Choose a difficulty to see its leaderboard.');
  if (!supabase) throw Error('Online leaderboard is unavailable until account setup is complete.');
  let request=supabase.rpc('leaderboard_players',{p_difficulty:difficulty});
  if(signal)request=request.abortSignal(signal);
  const { data, error } = await request;
  if (error||!Array.isArray(data)) throw new Error('Leaderboard unavailable. Check your connection and run the updated supabase.sql.');
  return data;
}


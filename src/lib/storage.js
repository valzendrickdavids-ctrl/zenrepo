import { supabase } from './supabase.js';
import { localRankings, validDifficulty } from './rankings.js';
export const readLocal = (key, fallback = null) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
export function writeLocal(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
const runKey = user => 'cc-run-' + user.id;
export async function loadRun(user) {
  const local = readLocal(runKey(user));
  if (user.demo || !supabase) return local;
  const { data, error } = await supabase.from('game_runs').select('state').eq('user_id', user.id).maybeSingle();
  if (error) throw new Error('Cloud progress could not load. Check your connection and database setup.');
  const remote = data?.state;
  return !remote || (local?.updatedAt ?? 0) > (remote.updatedAt ?? 0) ? local : remote;
}
export function cacheRun(user, run) { return writeLocal(runKey(user), run); }
export async function saveCloud(user, run) {
  if (user.demo || !supabase) return;
  const { error } = await supabase.from('game_runs').upsert({ user_id: user.id, state: run, updated_at: new Date().toISOString() });
  if (error) throw new Error('Cloud save failed. Progress is still saved on this device.');
}
export async function submitScore(user, run) {
  if (!validDifficulty(run.difficulty)) throw Error('Score has no valid difficulty. Start a new run.');
  if (user.demo) {
    const scores = readLocal('cc-demo-scores', []);
    if (!scores.some(s => s.run_id === run.id)) {
      if (!writeLocal('cc-demo-scores', [...scores, { run_id: run.id, user_id: user.id, difficulty: run.difficulty, display_name: user.name, best_score: run.score }])) throw Error('Device storage is full. Score could not be saved.');
    }
    return;
  }
  const { error } = await supabase.from('scores').upsert({ user_id: user.id, run_id: run.id, score: run.score, difficulty: run.difficulty }, { onConflict: 'user_id,run_id', ignoreDuplicates: true });
  if (error) throw new Error('Score could not upload. Try again when connected.');
}
export async function leaderboard(demo, difficulty) {
  if (!validDifficulty(difficulty)) throw new Error('Choose a difficulty to see its leaderboard.');
  if (demo || !supabase) return localRankings(readLocal('cc-demo-scores', []),difficulty);
  const { data, error } = await supabase.from('leaderboard_by_difficulty').select('display_name,best_score').eq('difficulty',difficulty).order('best_score', { ascending: false }).order('display_name').limit(20);
  if (error) throw new Error('Leaderboard unavailable. Check your connection and run the updated supabase.sql.');
  return data;
}


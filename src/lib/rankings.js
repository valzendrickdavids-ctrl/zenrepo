export const validDifficulty = value => ['easy','medium','hard'].includes(value);

export function localRankings(scores, difficulty) {
  if (!validDifficulty(difficulty) || !Array.isArray(scores)) return [];
  const best = new Map();
  for (const score of scores) {
    if (score.difficulty !== difficulty || !Number.isFinite(score.best_score) || score.best_score < 0) continue;
    const id = score.user_id || 'local-demo';
    if (!best.has(id) || best.get(id).best_score < score.best_score) {
      best.set(id, {display_name:score.display_name || 'Player', best_score:score.best_score});
    }
  }
  return [...best.values()].sort((a,b)=>b.best_score-a.best_score || a.display_name.localeCompare(b.display_name)).slice(0,20);
}

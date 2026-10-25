import { emptyBrush, TOTAL_CELLS, STROKE_LIMIT } from './brushEngine.js';
export const difficulties = {
  easy: { label: 'Beginner', seconds: 60, brush: 24, attempts: 8, multiplier: 1, color: '#2e86de' },
  medium: { label: 'Moderate', seconds: 40, brush: 18, attempts: 6, multiplier: 1.5, color: '#c46a12' },
  hard: { label: 'Expert', seconds: 25, brush: 12, attempts: 5, multiplier: 2, color: '#d54754' },
};
export const normalize = value => String(value).toLowerCase().replace(/\*/g, 'star').replace(/[^a-z0-9]/g, '');
export const matches = (level, guess) => [level.answer, ...level.aliases].some(a => normalize(a) === normalize(guess));
export const points = (revealed, seconds, difficulty) => Math.round((1000 * (1 - Math.min(100, Math.max(0, revealed)) / 100) + Math.max(0, seconds) * 5) * difficulties[difficulty].multiplier);
export function shuffle(items, random = Math.random) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
export function newRun(levels, difficulty) {
  return { version: 3, id: crypto.randomUUID(), order: shuffle(levels.filter(l => l.difficulty === difficulty).map(l => l.id)), difficulty, index: 0, score: 0, correct: 0, brushing: emptyBrush(), phase: 'playing', remaining: difficulties[difficulty].seconds, deadline: null, updatedAt: Date.now() };
}
export function validRun(run, levels) {
  const pool = levels.filter(l => l.difficulty === run?.difficulty);
  return run && run.version === 3 && difficulties[run.difficulty] && Array.isArray(run.order) &&
    run.order.length === pool.length && new Set(run.order).size === pool.length &&
    run.order.every(id => pool.some(l => l.id === id)) &&
    Number.isInteger(run.index) && run.index >= 0 && run.index < run.order.length &&
    Number.isFinite(run.score) && run.score >= 0 && Number.isFinite(run.remaining) &&
    ['playing', 'answered', 'complete'].includes(run.phase) &&
    validBrush(run.brushing, difficulties[run.difficulty].attempts);
}
function validBrush(b,limit) {
  const cells=a=>Array.isArray(a)&&a.length<=TOTAL_CELLS&&new Set(a).size===a.length&&a.every(n=>Number.isInteger(n)&&n>=0&&n<TOTAL_CELLS);
  return b&&Number.isInteger(b.used)&&b.used>=0&&b.used<=limit&&typeof b.active==='boolean'&&
    Number.isFinite(b.recoveryUntil)&&b.recoveryUntil>=0&&cells(b.seen)&&cells(b.stroke)&&b.stroke.length<=STROKE_LIMIT;
}


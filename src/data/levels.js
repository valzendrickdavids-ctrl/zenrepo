import { catalog } from './catalog.js';
export const levels = catalog.map(({ visual, icon, ...level }) => level);
export const poolCounts = Object.freeze({ easy: 100, medium: 75, hard: 50 });


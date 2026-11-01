import { catalog } from './catalog.js';
import { hints } from './hints.js';
import { rasterImages } from './rasterImages.js';
export const levels = catalog.map(({ visual, icon, ...level }) => ({ ...level, image: rasterImages[level.id]?.image || level.image, hint: hints[level.id] }));
export const poolCounts = Object.freeze({ easy: 100, medium: 75, hard: 50 });


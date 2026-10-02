import type { Model } from './model';

// The classes a keyed reveal target renders, straight from the Model (fed
// by the ObserveReveals mount in motion.ts). Under reduced motion every
// target simply IS in — the observers aren’t even installed, and
// styles.css quiets the transitions. Each site merges this into its own
// h.Class (foldkit keeps ONE class attribute per element, last one wins —
// a separate h.Class here would overwrite the site’s) and stamps the same
// key as `data-reveal-key`.
export const revealClass = (model: Model, key: string): string => {
  if (model.prefersReducedMotion) return 'is-in';
  const state = model.reveals[key];
  return state === undefined ? '' : state === 'drawn' ? 'is-in is-drawn' : 'is-in';
};

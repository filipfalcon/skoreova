import * as stylex from '@stylexjs/stylex';

import { tokens } from '../tokens.stylex';

// Styles for the competitions index (page/competitions.ts): the card grid
// and the per-competition progress track.

const SM = '@media (min-width: 640px)';
const LG = '@media (min-width: 1024px)';

export const styles = stylex.create({
  grid: {
    marginTop: '3rem',
    display: 'grid',
    gap: '1.5rem',
    gridTemplateColumns: {
      default: null,
      [SM]: 'repeat(2, minmax(0, 1fr))',
      [LG]: 'repeat(3, minmax(0, 1fr))',
    },
  },
  card: {
    display: 'block',
    height: '100%',
    padding: '1.5rem',
    borderColor: {
      default: tokens.ink,
      ':hover': tokens.pink,
    },
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  badge: {
    height: '3rem',
    width: '3rem',
  },
  name: {
    marginTop: '1.25rem',
    fontSize: '1.5rem',
    lineHeight: '2rem',
    color: tokens.ink,
  },
  stage: {
    marginTop: '0.5rem',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'color-mix(in srgb, var(--color-ink) 40%, transparent)',
  },
  track: {
    marginTop: '1rem',
    height: '0.25rem',
    backgroundColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
  },
  fill: {
    height: '100%',
    backgroundColor: tokens.pink,
  },
});

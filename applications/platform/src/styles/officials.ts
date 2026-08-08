import * as stylex from '@stylexjs/stylex';

import { tokens } from '../tokens.stylex';

// Styles for the officials screen (page/officials.ts): the card grid, the
// initials box, and the stat pairs.

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
  initials: {
    display: 'flex',
    height: '2.5rem',
    width: '2.5rem',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'color-mix(in srgb, var(--color-ink) 20%, transparent)',
    fontSize: '1rem',
    lineHeight: '1.5rem',
    color: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
  },
  name: {
    marginTop: '1.25rem',
    fontSize: '1.5rem',
    lineHeight: '2rem',
    color: tokens.ink,
  },
  statRow: {
    marginTop: '1rem',
    display: 'flex',
    gap: '2rem',
  },
  statValue: {
    fontSize: '1.875rem',
    lineHeight: '2.25rem',
  },
  statValuePink: {
    color: tokens.pink,
  },
  statValueInk: {
    color: tokens.ink,
  },
  statLabel: {
    marginTop: '0.25rem',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'color-mix(in srgb, var(--color-ink) 40%, transparent)',
  },
});

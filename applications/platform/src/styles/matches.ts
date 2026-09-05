import * as stylex from '@stylexjs/stylex';

import { tokens } from '../tokens.stylex';

// Styles for the standalone matches screen (page/matches.ts): the stacked
// per-league sections around the reused matches panel.

const MD = '@media (min-width: 768px)';

export const styles = stylex.create({
  stack: {
    marginTop: '3rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '3rem',
  },
  leagueName: {
    fontSize: {
      default: '1.5rem',
      [MD]: '1.875rem',
    },
    lineHeight: {
      default: '2rem',
      [MD]: '2.25rem',
    },
    color: tokens.ink,
  },
  panelSpacing: {
    marginTop: '1rem',
  },
  // The way back out of a club filter, at the row's end under the header.
  filterRow: {
    marginTop: '1.5rem',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  // The round and date leading a season row, in the meta voice, wide enough for "R12 · Oct 4".
  roundCell: {
    flexShrink: 0,
    width: '5.5rem',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
  },
});

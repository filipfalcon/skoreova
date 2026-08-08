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
});

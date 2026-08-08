import * as stylex from '@stylexjs/stylex';

import { tokens } from '../tokens.stylex';

// Styles for the players screen (page/players.ts): the scrollable stats
// table.

export const styles = stylex.create({
  tableWrapper: {
    marginTop: '3rem',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    minWidth: '640px',
    textAlign: 'left',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
  },
  headRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'color-mix(in srgb, var(--color-ink) 40%, transparent)',
  },
  cell: {
    paddingInline: '1.5rem',
    paddingBlock: '1rem',
  },
  headCell: {
    fontWeight: 400,
  },
  cellRight: {
    textAlign: 'right',
  },
  row: {
    borderBottomWidth: {
      default: 1,
      ':last-child': 0,
    },
    borderBottomColor: 'color-mix(in srgb, var(--color-ink) 5%, transparent)',
    backgroundColor: {
      default: null,
      ':hover': 'color-mix(in srgb, var(--color-ink) 4%, transparent)',
    },
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  cellIndex: {
    fontSize: '1rem',
    lineHeight: '1.5rem',
    color: 'color-mix(in srgb, var(--color-ink) 30%, transparent)',
  },
  cellName: {
    fontWeight: 500,
    color: tokens.ink,
  },
  cellMuted: {
    color: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
  },
  cellGoals: {
    fontSize: '1rem',
    lineHeight: '1.5rem',
    color: tokens.pink,
  },
});

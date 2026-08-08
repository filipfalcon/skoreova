import * as stylex from '@stylexjs/stylex';

import { tokens } from '../tokens.stylex';

// Styles for the Her Game screen (page/her-game.ts): the chart studio, the
// saved-chart cards, and the pinned feed. Follows the translation discipline
// stated in shared.ts: every fontSize carries its Tailwind pair's lineHeight,
// alpha tints are color-mix fades.

const SM = '@media (min-width: 640px)';
const MD = '@media (min-width: 768px)';
const LG = '@media (min-width: 1024px)';

export const styles = stylex.create({
  metricGroup: {
    marginTop: '1.5rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  metricOption: {
    cursor: 'pointer',
    borderWidth: 1,
    paddingInline: '1rem',
    paddingBlock: '0.5rem',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  metricOptionChecked: {
    borderColor: tokens.pink,
    backgroundColor: tokens.pink,
    color: tokens.ink,
  },
  metricOptionRest: {
    borderColor: {
      default: 'color-mix(in srgb, var(--color-ink) 15%, transparent)',
      ':hover': tokens.pink,
    },
    color: {
      default: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
      ':hover': tokens.ink,
    },
  },
  chart: {
    marginTop: '2rem',
    width: '100%',
  },
  chartBar: {
    fill: {
      default: 'color-mix(in srgb, var(--color-pink) 75%, transparent)',
      ':hover': tokens.pink,
    },
    transitionProperty: 'fill',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  chartAverageLine: {
    opacity: 0.4,
  },
  chartAxisLabel: {
    fill: 'color-mix(in srgb, var(--color-ink) 30%, transparent)',
    fontSize: '10px',
  },
  studioPanel: {
    marginTop: '3.5rem',
    padding: {
      default: '1.5rem',
      [MD]: '2rem',
    },
  },
  studioHeader: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  studioTitle: {
    marginTop: '0.5rem',
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
  studioMeta: {
    marginTop: '0.25rem',
    fontSize: '0.75rem',
    lineHeight: '1rem',
    color: 'color-mix(in srgb, var(--color-ink) 40%, transparent)',
  },
  saveButton: {
    borderWidth: 1,
    borderColor: {
      default: 'color-mix(in srgb, var(--color-ink) 15%, transparent)',
      ':hover': tokens.pink,
    },
    paddingInline: '1rem',
    paddingBlock: '0.5rem',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: {
      default: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
      ':hover': tokens.ink,
    },
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  savedCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem',
    borderColor: {
      default: null,
      ':hover': tokens.pink,
    },
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  savedCardTitle: {
    marginTop: '1.25rem',
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
    color: tokens.ink,
  },
  savedCardFooter: {
    marginTop: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  savedCardUpdated: {
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'color-mix(in srgb, var(--color-ink) 40%, transparent)',
  },
  section: {
    marginTop: '3.5rem',
  },
  pinnedTile: {
    display: 'flex',
    flexDirection: 'column',
  },
  pinnedTileTitle: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '10px',
    letterSpacing: '0.2em',
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
    textTransform: 'uppercase',
  },
  pinnedTileBody: {
    marginTop: '0.75rem',
  },
  emptyState: {
    marginTop: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'color-mix(in srgb, var(--color-ink) 20%, transparent)',
    padding: '1.5rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
  },
  pinnedGrid: {
    marginTop: '1.5rem',
    display: 'grid',
    alignItems: 'flex-start',
    columnGap: '1.5rem',
    rowGap: '2rem',
    gridTemplateColumns: {
      default: null,
      [SM]: 'repeat(2, minmax(0, 1fr))',
      [LG]: 'repeat(3, minmax(0, 1fr))',
    },
  },
  savedGrid: {
    marginTop: '1.5rem',
    display: 'grid',
    gap: '1.5rem',
    gridTemplateColumns: {
      default: null,
      [SM]: 'repeat(2, minmax(0, 1fr))',
      [LG]: 'repeat(3, minmax(0, 1fr))',
    },
  },
  newChartButton: {
    display: 'flex',
    minHeight: '10rem',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: {
      default: 'color-mix(in srgb, var(--color-ink) 20%, transparent)',
      ':hover': tokens.pink,
    },
    padding: '1.5rem',
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
    color: {
      default: 'color-mix(in srgb, var(--color-ink) 40%, transparent)',
      ':hover': tokens.pink,
    },
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
});

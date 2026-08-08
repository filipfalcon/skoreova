import * as stylex from '@stylexjs/stylex';

import { tokens } from '../tokens.stylex';

// Styles for the competition profile (page/competition-profile.ts): the
// profile header, the standings/format/history panels, the round-by-round
// matches panel, and the edition picker.

const SM = '@media (min-width: 640px)';
const MD = '@media (min-width: 768px)';
const LG = '@media (min-width: 1024px)';

export const styles = stylex.create({
  backLink: {
    display: 'inline-block',
    fontSize: '10px',
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    color: {
      default: 'color-mix(in srgb, var(--color-ink) 40%, transparent)',
      ':hover': tokens.pink,
    },
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  headerRow: {
    marginTop: '2rem',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: {
      default: '1.5rem',
      [MD]: '2rem',
    },
  },
  badge: {
    height: {
      default: '6rem',
      [MD]: '8rem',
    },
    width: {
      default: '6rem',
      [MD]: '8rem',
    },
    objectFit: 'contain',
  },
  title: {
    fontSize: {
      default: '3rem',
      [MD]: '4.5rem',
    },
    lineHeight: 1,
    color: tokens.ink,
  },
  chipRow: {
    marginTop: '1rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  honorChip: {
    display: 'inline-block',
    backgroundColor: tokens.pink,
    paddingInline: '0.75rem',
    paddingBlock: '0.375rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    letterSpacing: '0.15em',
    color: tokens.ink,
  },
  mutedChip: {
    display: 'inline-block',
    borderWidth: 1,
    borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)',
    paddingInline: '0.75rem',
    paddingBlock: '0.375rem',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
  },
  panelBody: {
    padding: {
      default: '1.5rem',
      [MD]: '2rem',
    },
  },
  list: {
    marginTop: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
  },
  standingsRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '1rem',
    borderTopWidth: {
      default: 1,
      ':first-child': 0,
    },
    paddingInline: '0.5rem',
    paddingBlock: '0.875rem',
  },
  standingsRowHighlighted: {
    borderTopColor: tokens.pink,
    backgroundColor: tokens.pink,
    color: tokens.ink,
  },
  standingsRowRest: {
    borderTopColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
  },
  standingsRank: {
    width: '2rem',
    fontSize: '1.125rem',
    lineHeight: '1.75rem',
  },
  standingsRankHighlighted: {
    color: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
  },
  standingsRankRest: {
    color: 'color-mix(in srgb, var(--color-ink) 30%, transparent)',
  },
  standingsTeam: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
  },
  standingsPlayed: {
    display: {
      default: 'none',
      [SM]: 'block',
    },
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
  },
  standingsPlayedHighlighted: {
    color: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
  },
  standingsPlayedRest: {
    color: 'color-mix(in srgb, var(--color-ink) 40%, transparent)',
  },
  standingsPoints: {
    width: '3rem',
    textAlign: 'right',
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
  },
  standingsPointsPink: {
    color: tokens.pink,
  },
  tieRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    columnGap: '1rem',
    borderTopWidth: {
      default: 1,
      ':first-child': 0,
    },
    borderTopColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    paddingInline: '0.5rem',
    paddingBlock: '0.875rem',
  },
  tiePrimary: {
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
    color: tokens.ink,
  },
  tieSecondary: {
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: tokens.pink,
  },
  formatRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '1rem',
    borderTopWidth: {
      default: 1,
      ':first-child': 0,
    },
    borderTopColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    paddingInline: '0.5rem',
    paddingBlock: '1rem',
  },
  formatNumber: {
    fontSize: '1.5rem',
    lineHeight: '2rem',
    color: tokens.pink,
  },
  formatRule: {
    fontSize: '0.875rem',
    lineHeight: 1.625,
    color: 'color-mix(in srgb, var(--color-ink) 80%, transparent)',
  },
  historyGrid: {
    marginTop: '2rem',
    display: 'grid',
    gap: '2rem',
    gridTemplateColumns: {
      default: null,
      [SM]: 'repeat(3, minmax(0, 1fr))',
    },
  },
  historyValue: {
    marginTop: '0.75rem',
    fontSize: '2.25rem',
    lineHeight: '2.5rem',
    color: tokens.ink,
  },
  historyLabel: {
    marginTop: '0.5rem',
    fontSize: '10px',
    lineHeight: 1.625,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
  },
  matchesHeader: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  arrowRow: {
    display: 'flex',
    gap: '0.5rem',
  },
  arrow: {
    borderWidth: 1,
    paddingInline: '0.875rem',
    paddingBlock: '0.375rem',
    fontSize: '1rem',
    lineHeight: '1.5rem',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  arrowBlocked: {
    cursor: 'default',
    borderColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    color: 'color-mix(in srgb, var(--color-ink) 20%, transparent)',
  },
  arrowLive: {
    cursor: 'pointer',
    borderColor: {
      default: 'color-mix(in srgb, var(--color-ink) 20%, transparent)',
      ':hover': tokens.pink,
    },
    color: {
      default: tokens.ink,
      ':hover': tokens.pink,
    },
  },
  matchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    borderTopWidth: {
      default: 1,
      ':first-child': 0,
    },
    borderTopColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    paddingBlock: '0.875rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
  },
  matchTeam: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: tokens.ink,
  },
  matchTeamHome: {
    textAlign: 'right',
  },
  scoreChip: {
    flexShrink: 0,
    backgroundColor: tokens.pink,
    paddingInline: '0.625rem',
    paddingBlock: '0.25rem',
    fontSize: '1rem',
    lineHeight: '1.5rem',
    color: tokens.ink,
  },
  vsChip: {
    flexShrink: 0,
    borderWidth: 1,
    borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)',
    paddingInline: '0.625rem',
    paddingBlock: '0.25rem',
    fontSize: '1rem',
    lineHeight: '1.5rem',
    color: 'color-mix(in srgb, var(--color-ink) 40%, transparent)',
  },
  editionGroup: {
    marginTop: '2rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  editionOption: {
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
  editionChecked: {
    borderColor: tokens.pink,
    backgroundColor: tokens.pink,
    color: tokens.ink,
  },
  editionRest: {
    borderColor: {
      default: 'color-mix(in srgb, var(--color-ink) 15%, transparent)',
      ':hover': tokens.pink,
    },
    color: {
      default: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
      ':hover': tokens.ink,
    },
  },
  archiveDetail: {
    marginTop: '1.5rem',
    fontSize: {
      default: '1.875rem',
      [MD]: '2.25rem',
    },
    lineHeight: {
      default: '2.25rem',
      [MD]: '2.5rem',
    },
    color: tokens.ink,
  },
  archiveNote: {
    marginTop: '0.75rem',
    fontSize: '0.75rem',
    lineHeight: 1.625,
    color: 'color-mix(in srgb, var(--color-ink) 40%, transparent)',
  },
  stack: {
    marginTop: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  panelPair: {
    display: 'grid',
    gap: '2rem',
    gridTemplateColumns: {
      default: null,
      [LG]: 'repeat(2, minmax(0, 1fr))',
    },
  },
});

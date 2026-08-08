import * as stylex from '@stylexjs/stylex';

import { tokens } from '../tokens.stylex';

// Styles for the standings engine (standings.ts): the zone ribbon colors,
// the table rows, the legend, and the season progress bar.

const SM = '@media (min-width: 640px)';
const MD = '@media (min-width: 768px)';

export const styles = stylex.create({
  // Zone colors — bars and their label inks. NOT brand pink (user call):
  // pink is the highlight row, the points and every chip, so it reads as
  // brand rather than as a prize — and it disappears completely against
  // the club's own pink row. The -ink variants are what the picked hues
  // become as 10px uppercase type on PAPER — see the tokens in styles.css.
  uclBar: {
    backgroundColor: tokens.ucl,
  },
  uclText: {
    color: tokens.ucl,
  },
  uecInkBar: {
    backgroundColor: tokens.uecInk,
  },
  uecInkText: {
    color: tokens.uecInk,
  },
  riseInkBar: {
    backgroundColor: tokens.riseInk,
  },
  riseInkText: {
    color: tokens.riseInk,
  },
  dropBar: {
    backgroundColor: tokens.drop,
  },
  dropText: {
    color: tokens.drop,
  },
  mutedBar: {
    backgroundColor: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
  },
  mutedText: {
    color: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
  },
  transparentBar: {
    backgroundColor: 'transparent',
  },
  transparentText: {
    color: 'transparent',
  },
  progress: {
    marginTop: '1.5rem',
  },
  progressHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
  },
  progressLabel: {
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
  },
  progressShare: {
    color: tokens.pink,
  },
  progressTrack: {
    marginTop: '0.5rem',
    display: 'flex',
    gap: '3px',
  },
  progressSegment: {
    height: '0.5rem',
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
  },
  progressSegmentPlayed: {
    backgroundColor: tokens.pink,
  },
  progressSegmentLeft: {
    backgroundColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)',
  },
  // Column key — 19px = 6px band + 1px hairline + 12px row padding, so the
  // CLUB key sits exactly over the club names. Fixed columns stay NARROW
  // below md: the score column eats the room the club name used to have,
  // and a truncated club name reads as a bug (checked at 320, where the
  // longest name only just clears).
  columnKey: {
    marginTop: '2rem',
    display: 'flex',
    alignItems: 'baseline',
    gap: {
      default: '0.5rem',
      [SM]: '0.75rem',
      [MD]: '1rem',
    },
    paddingRight: '0.5rem',
    paddingLeft: '19px',
    fontSize: '10px',
    letterSpacing: '0.2em',
    color: 'color-mix(in srgb, var(--color-ink) 45%, transparent)',
    textTransform: 'uppercase',
  },
  columnPosition: {
    width: {
      default: '1.5rem',
      [MD]: '2rem',
    },
  },
  columnClub: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
  },
  columnQualification: {
    display: {
      default: 'none',
      [MD]: 'block',
    },
    width: '7rem',
  },
  columnScore: {
    width: {
      default: '3rem',
      [MD]: '5rem',
    },
    textAlign: 'right',
  },
  columnPoints: {
    width: {
      default: '2.5rem',
      [MD]: '3rem',
    },
    textAlign: 'right',
  },
  rows: {
    display: 'flex',
    flexDirection: 'column',
  },
  rowsWrapper: {
    marginTop: '0.5rem',
  },
  // The band lives in a GUTTER outside the row's own background — see the
  // note at the view. gap-px leaves a paper hairline between band and row.
  rowShell: {
    display: 'flex',
    alignItems: 'stretch',
    gap: '1px',
  },
  rowGutter: {
    width: '0.375rem',
    flexShrink: 0,
  },
  row: {
    display: 'flex',
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    alignItems: 'baseline',
    gap: {
      default: '0.5rem',
      [SM]: '0.75rem',
      [MD]: '1rem',
    },
    paddingBlock: '0.875rem',
    paddingRight: '0.5rem',
    paddingLeft: '0.75rem',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  rowBordered: {
    borderTopWidth: 1,
  },
  rowHighlighted: {
    borderColor: tokens.pink,
    backgroundColor: tokens.pink,
    color: tokens.ink,
  },
  rowRest: {
    borderColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    color: tokens.ink,
    backgroundColor: {
      default: null,
      ':hover': 'color-mix(in srgb, var(--color-ink) 5%, transparent)',
    },
  },
  rowPosition: {
    width: {
      default: '1.5rem',
      [MD]: '2rem',
    },
    fontSize: '1.125rem',
    lineHeight: '1.75rem',
  },
  rowPositionHighlighted: {
    color: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
  },
  rowPositionRest: {
    color: 'color-mix(in srgb, var(--color-ink) 35%, transparent)',
  },
  rowTeam: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: {
      default: '1.125rem',
      [SM]: '1.25rem',
    },
    lineHeight: {
      default: '1.75rem',
      [SM]: '1.75rem',
    },
  },
  // The zone spelled out where there is room — desktop has it to spare,
  // and a named prize beats decoding a color.
  rowZone: {
    display: {
      default: 'none',
      [MD]: 'block',
    },
    width: '7rem',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
  },
  rowZoneHighlighted: {
    color: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
  },
  // Goal record — "skóre" in the Czech sense: scored:conceded,
  // tabular-nums so the colons line up down the column.
  rowScore: {
    width: {
      default: '3rem',
      [MD]: '5rem',
    },
    textAlign: 'right',
    fontSize: {
      default: '1rem',
      [MD]: '1.25rem',
    },
    lineHeight: {
      default: '1.5rem',
      [MD]: '1.75rem',
    },
    fontVariantNumeric: 'tabular-nums',
  },
  rowScoreHighlighted: {
    color: 'color-mix(in srgb, var(--color-ink) 70%, transparent)',
  },
  rowScoreRest: {
    color: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
  },
  rowPoints: {
    width: {
      default: '2.5rem',
      [MD]: '3rem',
    },
    textAlign: 'right',
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
    fontVariantNumeric: 'tabular-nums',
  },
  rowPointsRest: {
    color: tokens.pink,
  },
  // Legend — carries the zone colors below md, where the named column is
  // hidden. Swatches are BARS of the same width as the ribbon, not
  // squares, so the mapping back to the table is immediate.
  legend: {
    marginTop: '1.25rem',
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: '1.5rem',
    rowGap: '0.5rem',
  },
  legendEntry: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  legendSwatch: {
    height: '1rem',
    width: '0.375rem',
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: '10px',
    letterSpacing: '0.2em',
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
    textTransform: 'uppercase',
  },
  headline: {
    marginTop: '1.25rem',
    fontSize: {
      default: '1.25rem',
      [MD]: '1.5rem',
    },
    lineHeight: {
      default: '1.75rem',
      [MD]: '2rem',
    },
    color: 'color-mix(in srgb, var(--color-ink) 70%, transparent)',
  },
});

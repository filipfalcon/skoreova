import * as stylex from '@stylexjs/stylex';

import { tokens } from '../tokens.stylex';

// Styles for the home screen (page/welcome.ts): the market ticker, the
// crest honeycomb, the section boards, the new-content ledger, the
// all-time bests grid, and the browse tiles.

const SM = '@media (min-width: 640px)';
const MD = '@media (min-width: 768px)';
const LG = '@media (min-width: 1024px)';
const XL = '@media (min-width: 1280px)';

export const styles = stylex.create({
  section: {
    marginTop: '3rem',
  },
  chipRow: {
    display: 'flex',
  },
  newList: {
    marginTop: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
  },
  // A hairline rules each row off the one before; the first row drops
  // both the rule and its top padding so the ledger starts flush.
  newRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    borderTopWidth: {
      default: 1,
      ':first-child': 0,
    },
    borderTopColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    paddingTop: {
      default: '1rem',
      [MD]: '1.25rem',
      ':first-child': 0,
    },
    paddingBottom: {
      default: '1rem',
      [MD]: '1.25rem',
    },
  },
  newRowBody: {
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
  },
  newTitle: {
    fontSize: {
      default: '1.5rem',
      [MD]: '1.875rem',
    },
    lineHeight: 1.05,
    color: tokens.ink,
  },
  newKind: {
    marginTop: '0.375rem',
    fontSize: {
      default: '10px',
      [MD]: '11px',
    },
    letterSpacing: '0.2em',
    color: 'color-mix(in srgb, var(--color-ink) 40%, transparent)',
    textTransform: 'uppercase',
  },
  newWhen: {
    flexShrink: 0,
    fontSize: {
      default: '0.75rem',
      [MD]: '0.875rem',
    },
    lineHeight: {
      default: '1rem',
      [MD]: '1.25rem',
    },
    letterSpacing: '0.2em',
    color: tokens.pink,
    textTransform: 'uppercase',
  },
  trendingGrid: {
    marginTop: '1rem',
    display: 'grid',
    gridTemplateColumns: {
      default: 'repeat(2, minmax(0, 1fr))',
      [SM]: 'repeat(3, minmax(0, 1fr))',
    },
    gap: {
      default: '1rem',
      [LG]: '1.5rem',
    },
  },
  // The leader's double width — carried by the grid child (the li), not
  // the tile inside it.
  trendingLeaderCell: {
    gridColumn: {
      default: 'span 2 / span 2',
      [SM]: 'span 1 / span 1',
    },
  },
  statGrid: {
    marginTop: '1rem',
    display: 'grid',
    gap: {
      default: '1rem',
      [LG]: '1.5rem',
    },
    gridTemplateColumns: {
      default: null,
      [SM]: 'repeat(2, minmax(0, 1fr))',
    },
  },
  quote: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: {
      default: '1rem',
      [MD]: '1.125rem',
    },
    lineHeight: {
      default: '1.5rem',
      [MD]: '1.75rem',
    },
    letterSpacing: '0.08em',
    whiteSpace: 'nowrap',
    color: tokens.paper,
  },
  quoteDelta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  quoteDeltaUp: {
    color: tokens.rise,
  },
  quoteDeltaDown: {
    color: tokens.fall,
  },
  tickerRun: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    paddingRight: '1.5rem',
  },
  // FULL-BLEED at every width: 50% of the container minus 50vw walks the
  // strip out to the viewport edges regardless of the max-w cap.
  tickerStrip: {
    marginInline: 'calc(50% - 50vw)',
    backgroundColor: tokens.ink,
    paddingBlock: '0.625rem',
  },
  tickerPull: {
    marginTop: {
      default: '-2.5rem',
      [MD]: '-3.5rem',
    },
  },
  crestLink: {
    display: 'block',
    flexShrink: 0,
    transform: {
      default: null,
      ':hover': 'scale(1.05)',
    },
    transitionProperty: 'transform',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  // The xl one-liner maxes the container: (1200 − 15×4px grout) / 16 =
  // 71.25 → 71px cells (16×71 + 60 = 1196 ≤ 1200); below xl the comb
  // formation handles every width.
  crestCell: {
    display: 'flex',
    height: {
      default: '83px',
      [XL]: '82px',
    },
    width: {
      default: '72px',
      [XL]: '71px',
    },
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: {
      default: '#fff',
      ':hover': tokens.pink,
    },
    padding: '0.875rem',
    clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  crestLogo: {
    height: '100%',
    width: '100%',
    objectFit: 'contain',
  },
  crestRail: {
    marginTop: '2rem',
  },
  crestComb: {
    display: {
      default: 'flex',
      [XL]: 'none',
    },
    flexDirection: 'column',
    alignItems: 'center',
  },
  crestRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '4px',
  },
  crestRowTucked: {
    marginTop: '-17px',
  },
  crestLine: {
    display: {
      default: 'none',
      [XL]: 'flex',
    },
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '4px',
  },
  // Composed over shared.panel: the frame comes from the panel, only the
  // hover tint and its transition live here.
  sectionTile: {
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
  sectionTileTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  sectionTileCount: {
    fontSize: '2.25rem',
    lineHeight: '2.5rem',
    color: tokens.pink,
  },
  sectionTileArt: {
    display: 'flex',
  },
  // The crest fan overlaps by 0.75rem; the first crest starts flush.
  sectionTileCrest: {
    marginLeft: {
      default: '-0.75rem',
      ':first-child': 0,
    },
    height: '2.5rem',
    width: '2.5rem',
    borderRadius: '9999px',
    borderWidth: 1,
    borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)',
    backgroundColor: tokens.paper,
    objectFit: 'contain',
    padding: '0.375rem',
  },
  sectionTileLabel: {
    marginTop: '1rem',
    fontSize: '1.5rem',
    lineHeight: '2rem',
    color: tokens.ink,
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  sectionTileCaption: {
    marginTop: '0.25rem',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'color-mix(in srgb, var(--color-ink) 40%, transparent)',
  },
  bestsGrid: {
    marginTop: '2rem',
    display: 'grid',
    columnGap: '2rem',
    rowGap: '2.5rem',
    gridTemplateColumns: {
      default: null,
      [SM]: 'repeat(2, minmax(0, 1fr))',
      [LG]: 'repeat(3, minmax(0, 1fr))',
    },
  },
  sectionTilesGrid: {
    marginTop: '4rem',
    display: 'grid',
    gap: '1.5rem',
    gridTemplateColumns: {
      default: null,
      [SM]: 'repeat(2, minmax(0, 1fr))',
      [LG]: 'repeat(3, minmax(0, 1fr))',
    },
  },
});

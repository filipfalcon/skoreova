import * as stylex from '@stylexjs/stylex';

import { tokens } from '../tokens.stylex';

// Styles for the pinnable tiles (stat-tiles.ts): trending tiles, the
// league stat cards, the pin overlay, and the all-time-best records.

const SM = '@media (min-width: 640px)';
const MD = '@media (min-width: 768px)';
const LG = '@media (min-width: 1024px)';

export const styles = stylex.create({
  tileWrapper: {
    position: 'relative',
  },
  // One trending tile. Photo tiles are FRAMELESS (user call — the ink
  // border read as clutter around a dark image): the photo IS the card
  // edge; only the photoless fallback keeps the panel frame. justify-end
  // pins the name to the bottom edge and the min-heights carry the
  // photo's presence. Phone: EVERY tile runs full-width landscape; the
  // leader stays the tallest; the grid takes over from `sm`.
  tile: {
    position: 'relative',
    isolation: 'isolate',
    display: 'flex',
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    padding: '1.25rem',
  },
  tileLeader: {
    minHeight: {
      default: '16rem',
      [MD]: '11rem',
      [LG]: '14rem',
    },
  },
  tileFollower: {
    minHeight: {
      default: '11rem',
      [SM]: '15rem',
      [MD]: '11rem',
      [LG]: '14rem',
    },
  },
  tileFeatured: {
    backgroundColor: tokens.ink,
  },
  tileFramed: {
    borderWidth: 2,
    borderColor: {
      default: tokens.ink,
      ':hover': tokens.pink,
    },
    backgroundColor: tokens.paper,
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  tilePhoto: {
    position: 'absolute',
    inset: 0,
    zIndex: -20,
    height: '100%',
    width: '100%',
    objectFit: 'cover',
  },
  // Featured tiles run DARK: an ink gradient rises from the bottom so the
  // paper type stays readable over any crop.
  tileGradient: {
    position: 'absolute',
    inset: 0,
    zIndex: -10,
    backgroundImage:
      'linear-gradient(to top, color-mix(in srgb, var(--color-ink) 90%, transparent), color-mix(in srgb, var(--color-ink) 40%, transparent), color-mix(in srgb, var(--color-ink) 20%, transparent))',
  },
  // Names WRAP instead of truncating — an ellipsis on a person's name
  // reads as a bug.
  tileName: {
    lineHeight: 1.05,
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  tileNameLeader: {
    fontSize: {
      default: '2.25rem',
      [SM]: '1.5rem',
    },
  },
  tileNameFollower: {
    fontSize: {
      default: '1.875rem',
      [SM]: '1.5rem',
    },
  },
  tileNamePaper: {
    color: tokens.paper,
  },
  tileNameInk: {
    color: tokens.ink,
  },
  tileKind: {
    marginTop: '0.5rem',
    fontSize: {
      default: '11px',
      [SM]: '10px',
    },
    lineHeight: 1,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
  },
  tileKindPaper: {
    color: 'color-mix(in srgb, var(--color-paper) 70%, transparent)',
  },
  tileKindInk: {
    color: 'color-mix(in srgb, var(--color-ink) 40%, transparent)',
  },
  // The per-round chart — a compact SPARKLINE that sits inline with the
  // figures. Heights spread across the min–max band in the view.
  spark: {
    display: 'flex',
    height: {
      default: '4rem',
      [MD]: '5rem',
    },
    width: {
      default: '100%',
      [MD]: '13rem',
    },
    alignItems: 'flex-end',
    gap: '3px',
  },
  sparkBar: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
  },
  sparkBarCurrent: {
    backgroundColor: tokens.pink,
  },
  sparkBarPast: {
    backgroundColor: 'color-mix(in srgb, var(--color-paper) 30%, transparent)',
  },
  // The pin for a PHOTO tile — icon-only and always solid-backed so it
  // reads on any crop. Sits over the tile as an absolute sibling of the
  // card link, never inside it.
  pinOverlay: {
    position: 'absolute',
    top: '0.75rem',
    right: '0.75rem',
    zIndex: 10,
    display: 'flex',
    height: '2.25rem',
    width: '2.25rem',
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  pinOverlayPinned: {
    backgroundColor: tokens.pink,
    color: tokens.ink,
  },
  pinOverlayUnpinned: {
    backgroundColor: {
      default: 'color-mix(in srgb, var(--color-paper) 90%, transparent)',
      ':hover': tokens.pink,
    },
    color: tokens.ink,
  },
  // FINAL stat-card anatomy: NO text ever sits on the photo — a clean
  // photo band up top, the figures in a solid ink footer with guaranteed
  // contrast, and a hard pink seam between them.
  card: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: tokens.ink,
  },
  cardPhotoBand: {
    position: 'relative',
    height: {
      default: '12rem',
      [MD]: '14rem',
    },
    width: '100%',
    overflow: 'hidden',
  },
  // A slow settle-in zoom on hover (the hover-card-zoom contract) — the
  // photo is the only piece that moves; the figures stay put.
  cardPhoto: {
    position: 'absolute',
    inset: 0,
    height: '100%',
    width: '100%',
    objectFit: 'cover',
    transitionProperty: 'transform',
    transitionDuration: '0.7s',
    transitionTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
  },
  cardSeam: {
    height: '3px',
    width: '100%',
    flexShrink: 0,
    backgroundColor: tokens.pink,
  },
  cardFooter: {
    display: 'flex',
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    flexDirection: 'column',
    padding: {
      default: '1.25rem',
      [MD]: '1.5rem',
    },
  },
  cardHeadlineRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  // The LEAGUE is the headline of the card (user call) — full Anton
  // display voice, with the movement answering on the same baseline.
  cardLeague: {
    fontSize: {
      default: '1.5rem',
      [MD]: '1.875rem',
    },
    lineHeight: 1.05,
    color: tokens.paper,
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  cardDelta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: {
      default: '1.25rem',
      [MD]: '1.5rem',
    },
    lineHeight: {
      default: '1.75rem',
      [MD]: '2rem',
    },
  },
  cardDeltaUp: {
    color: tokens.rise,
  },
  cardDeltaDown: {
    color: tokens.fall,
  },
  cardFiguresRow: {
    marginTop: '1.5rem',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    columnGap: '1.5rem',
    rowGap: '1rem',
  },
  cardRoundRow: {
    display: 'flex',
  },
  // The round wears the PINK STAMP (the matches panel's score-chip
  // grammar): this is the fresh number, everything else is context.
  cardRound: {
    backgroundColor: tokens.pink,
    paddingInline: '0.625rem',
    paddingBlock: '0.25rem',
    fontSize: {
      default: '1.875rem',
      [MD]: '2.25rem',
    },
    lineHeight: 1.05,
    color: tokens.ink,
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  cardCaption: {
    marginTop: '0.5rem',
    fontSize: '10px',
    lineHeight: 1,
    letterSpacing: '0.2em',
    color: 'color-mix(in srgb, var(--color-paper) 50%, transparent)',
    textTransform: 'uppercase',
  },
  cardSeason: {
    fontSize: {
      default: '2.25rem',
      [MD]: '3rem',
    },
    lineHeight: 1.05,
    color: 'color-mix(in srgb, var(--color-paper) 60%, transparent)',
  },
  // Below `md` the sparkline ALWAYS takes its own full-bleed strip along
  // the card's bottom (flex-wrap used to decide per card and the boards
  // looked mismatched); from `md` it sits inline, bleeding into the
  // bottom-right corner (negative margins cancel the footer padding).
  cardSparkStrip: {
    marginInline: {
      default: '-1.25rem',
      [MD]: null,
    },
    marginLeft: {
      default: null,
      [MD]: 0,
    },
    marginRight: {
      default: null,
      [MD]: '-1.5rem',
    },
    marginBottom: {
      default: '-1.25rem',
      [MD]: '-1.5rem',
    },
    flexBasis: {
      default: '100%',
      [MD]: 'auto',
    },
  },
  record: {
    display: 'flex',
    flexDirection: 'column',
  },
  recordStandalone: {
    alignItems: 'flex-start',
    textAlign: 'left',
  },
  recordCentered: {
    alignItems: {
      default: 'center',
      [SM]: 'flex-start',
    },
    textAlign: {
      default: 'center',
      [SM]: 'left',
    },
  },
  // The tick, now a hit target: pink bar at rest, growing a pin glyph
  // beside it when pinned so the state reads without color.
  recordPin: {
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: '0.5rem',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  recordPinPinned: {
    color: tokens.pink,
  },
  recordPinUnpinned: {
    color: {
      default: 'color-mix(in srgb, var(--color-ink) 30%, transparent)',
      ':hover': tokens.pink,
    },
  },
  recordTick: {
    height: '0.25rem',
    width: '2.5rem',
    backgroundColor: tokens.pink,
  },
  recordValue: {
    marginTop: '0.75rem',
    fontSize: {
      default: '3rem',
      [SM]: '2.25rem',
      [MD]: '3rem',
    },
    lineHeight: {
      default: 1,
      [SM]: '2.5rem',
      [MD]: 1,
    },
    color: tokens.ink,
  },
  recordHolder: {
    marginTop: '0.5rem',
    fontSize: {
      default: '1.5rem',
      [SM]: '1.25rem',
      [MD]: '1.5rem',
    },
    lineHeight: {
      default: '2rem',
      [SM]: '1.75rem',
      [MD]: '2rem',
    },
    color: tokens.pink,
  },
  recordLabel: {
    marginTop: '0.375rem',
    fontSize: {
      default: '10px',
      [MD]: '11px',
    },
    letterSpacing: '0.25em',
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
    textTransform: 'uppercase',
  },
});

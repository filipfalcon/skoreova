import * as stylex from '@stylexjs/stylex';

import { spacing, tokens } from '../tokens.stylex';

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
  // THE PULSE — the page's first section, and the only one with no top
  // margin: its ticker has to kiss the header, so the air lives under the
  // ticker instead (see pulseChipRow).
  pulseSection: {
    marginTop: 0,
  },
  pulseChipRow: {
    marginTop: spacing.lg,
    display: 'flex',
  },
  // A section sitting directly under the tape keeps the tape's own air rather
  // than the 3rem that separates one board from the next — the strip is the
  // page's top edge, not a neighbour.
  sectionUnderTicker: {
    marginTop: spacing.lg,
  },
  // THE FEED FRAME — a hairline box holding the chip and the fixtures
  // together, so the cards read as something inside the feed rather than as
  // the next band down the page.
  feedFrame: {
    borderWidth: 1,
    borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)',
    paddingBlock: spacing.md,
    paddingInline: spacing.md,
  },
  // The track bleeds back out to the frame's edge, so a peeking card is cut
  // by the border rather than stopping short of it inside the padding.
  feedTrack: {
    marginInline: `calc(-1 * ${spacing.md})`,
    paddingInline: spacing.md,
  },
  // The chip and the manage switch share the frame's top line, pushed to
  // opposite ends. Baseline rather than center: the chip is display type and
  // the switch is body text, so their centers do not agree.
  feedHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  // A quiet text switch, not a second chip — the pink chip beside it already
  // owns the section's one loud mark.
  feedManage: {
    fontSize: '0.8125rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: {
      default: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
      ':hover': tokens.ink,
    },
    textDecorationLine: {
      default: 'none',
      ':hover': 'underline',
    },
  },
  feedBlockBar: {
    marginTop: spacing.md,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  // The destructive half of the manage state, so it carries the pink the rest
  // of the feed withholds.
  feedUnpin: {
    fontSize: '0.8125rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    borderWidth: 1,
    borderColor: tokens.pink,
    paddingBlock: '0.25rem',
    paddingInline: spacing.sm,
    color: {
      default: tokens.ink,
      ':hover': tokens.paper,
    },
    backgroundColor: {
      default: 'transparent',
      ':hover': tokens.pink,
    },
  },
  feedEmpty: {
    marginTop: spacing.md,
    color: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
  },
  // The invitation reads as an empty slot waiting to be filled, which is what
  // the dashed rule says and a solid one would not.
  feedAddWidget: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'color-mix(in srgb, var(--color-ink) 30%, transparent)',
    paddingBlock: spacing.lg,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
  },
  // The refusal is the one place the feed speaks in the fall color the tape
  // uses for a drop — it is a no, and it should not look like a caption.
  feedRefusal: {
    marginTop: spacing.sm,
    fontSize: '0.8125rem',
    color: tokens.fall,
  },
  // THE CAROUSEL. Swipe, snap, no dots — the next card's edge peeking past
  // the last visible one is the only scroll cue there is.
  //
  // `stretch` is load-bearing: it equalizes card heights across the track, so
  // a result card's empty footer lands on the same baseline as an
  // invitation's kickoff and ground (the card pins its footer with
  // margin-top: auto). Without it every card would be its own height and the
  // row would look ragged.
  pulseTrack: {
    marginTop: spacing.md,
    display: 'flex',
    // START, not stretch. The hero is deliberately taller than the compact
    // cards now (272 against 200), and stretching would hand every compact
    // card the hero's height and hollow it out. Each card states its own
    // height instead, and the compacts all state the same one.
    alignItems: 'flex-start',
    gap: spacing.sm,
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    // No vertical rubber-banding stolen from the page while a finger is
    // swiping the track.
    overscrollBehaviorX: 'contain',
    // Cards are opaque blocks with no rim; a few pixels of air keeps a focus
    // ring from being clipped by the scroll container.
    paddingBottom: '3px',
  },
  // The card width is DERIVED, not picked, and the arithmetic is the same at
  // every width: for N cards in view, N widths + N−1 gaps + one more gap +
  // the peek must come to 100%, so width = 100%/N − gap − peek/N. With gap
  // `sm` (12) and peek `lg` (24) that lands on scale steps at all three
  // counts — 100%−sm−lg, 50%−sm−sm, and 33.333%−sm−xs — which is why the
  // peek is exactly 24px whether the reader sees one card or three.
  pulseCard: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: {
      default: `calc(100% - ${spacing.sm} - ${spacing.lg})`,
      [SM]: `calc(50% - ${spacing.sm} - ${spacing.sm})`,
      [LG]: `calc(33.333% - ${spacing.sm} - ${spacing.xs})`,
    },
    scrollSnapAlign: 'start',
  },
  // THE HERO SLOT is wider than the rest — but not "85% of the viewport",
  // which is the one number in the brief the layout could not honour
  // literally. At 390px the track is 350px wide (the page's own gutters), so
  // 85vw is 331px and leaves 7px of the next card: the peek collapses, and
  // the peek is the section's only scroll cue.
  //
  // So the hero takes the widest basis that keeps the 24px peek exact —
  // `100% - sm - lg` of the track, which at 390px is 314px, or 80.5% of the
  // viewport. Four and a half points off the brief, in exchange for keeping
  // the cue. Below `sm` that is the same width a compact card already has, so
  // the hero earns its lead through HEIGHT (a taller photo card, which
  // stretches the whole track) rather than width; from `sm` up, where the
  // compacts shrink to halves and thirds, the hero visibly outsizes them.
  pulseHeroCard: {
    flexBasis: {
      default: `calc(100% - ${spacing.sm} - ${spacing.lg})`,
      [SM]: `calc(100% - ${spacing.sm} - ${spacing.lg})`,
      [LG]: `calc(66.666% - ${spacing.sm} - ${spacing.xs})`,
    },
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
  // A TRACK, not a grid. Eight entries in a grid is three rows of tiles on a
  // phone before anything else on the page gets a look in; swiped, the same
  // eight cost one tile's height. Same arithmetic as the weekend board's
  // carousel, so the two scroll alike and show the same 24px of the next card.
  trendingTrack: {
    marginTop: '1rem',
    display: 'flex',
    alignItems: 'stretch',
    gap: spacing.sm,
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    overscrollBehaviorX: 'contain',
    paddingBottom: '3px',
  },
  trendingCard: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: {
      default: `calc(100% - ${spacing.sm} - ${spacing.lg})`,
      [SM]: `calc(50% - ${spacing.sm} - ${spacing.sm})`,
      [LG]: `calc(33.333% - ${spacing.sm} - ${spacing.xs})`,
    },
    scrollSnapAlign: 'start',
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
  // Lifted off ink onto the panel tone, so the tape reads as its own band
  // rather than merging into the black navigation above it. This is as far as
  // it can go on the current palette: --color-fall measures 4.55:1 here and
  // 4.32:1 one step lighter, and the delta text is 18px at weight 400, which
  // owes the full 4.5:1 rather than the large-text 3:1.
  tickerStrip: {
    marginInline: 'calc(50% - 50vw)',
    backgroundColor: tokens.panel,
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

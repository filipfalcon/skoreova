import * as stylex from '@stylexjs/stylex';

import { tokens } from '../tokens.stylex';

// Styles for the club profile (page/club-profile.ts): the full-bleed dark
// editorial band — hero artwork, crest and name, honors, commentary — and
// the paper data act's cup run, scorer boards, history grid and follow call.

const SM = '@media (min-width: 640px)';
const MD = '@media (min-width: 768px)';
const LG = '@media (min-width: 1024px)';

export const styles = stylex.create({
  // The dark act — flows straight out of the header chrome, full-bleed via
  // the 50%-50vw margin trick.
  darkBand: {
    position: 'relative',
    marginTop: {
      default: '-2.5rem',
      [MD]: '-3.5rem',
    },
    marginInline: 'calc(50% - 50vw)',
    overflow: 'hidden',
    backgroundColor: tokens.ink,
    paddingInline: {
      default: '1.25rem',
      [MD]: '2.5rem',
    },
    paddingTop: '2rem',
    paddingBottom: {
      default: '4rem',
      [MD]: '5rem',
    },
  },
  // The hero artwork wrapper — cancels the band's padding so the photo
  // runs edge to edge; the parallax drift is the club-hero-art contract.
  heroArt: {
    position: 'relative',
    marginInline: {
      default: '-1.25rem',
      [MD]: '-2.5rem',
    },
    marginTop: '-2rem',
    height: {
      default: '22rem',
      [MD]: '34rem',
    },
    overflow: 'hidden',
    willChange: 'transform',
  },
  // Phones ZOOM the artwork in (user call — the wide frame shrank the
  // players to specks); md+ shows the full crop.
  heroArtImage: {
    position: 'absolute',
    inset: 0,
    height: '100%',
    width: '100%',
    transform: {
      default: 'scale(1.45)',
      [MD]: 'scale(1)',
    },
    objectFit: 'cover',
  },
  heroArtFade: {
    position: 'absolute',
    insetInline: 0,
    bottom: 0,
    height: '12rem',
    backgroundImage:
      'linear-gradient(to top, var(--color-ink), color-mix(in srgb, var(--color-ink) 60%, transparent), transparent)',
  },
  backLinkOnArt: {
    position: 'absolute',
    top: '1.25rem',
    left: {
      default: '1.25rem',
      [MD]: '2.5rem',
    },
    zIndex: 10,
    fontSize: '10px',
    letterSpacing: '0.2em',
    color: {
      default: 'color-mix(in srgb, var(--color-paper) 70%, transparent)',
      ':hover': tokens.pink,
    },
    textTransform: 'uppercase',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  bandColumn: {
    position: 'relative',
    zIndex: 10,
    marginInline: 'auto',
    width: '100%',
    maxWidth: '64rem',
  },
  backRow: {
    display: 'flex',
  },
  backLink: {
    fontSize: '10px',
    letterSpacing: '0.2em',
    color: {
      default: 'color-mix(in srgb, var(--color-paper) 50%, transparent)',
      ':hover': tokens.pink,
    },
    textTransform: 'uppercase',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  hero: {
    textAlign: 'center',
  },
  // Over the artwork the hero pulls UP into the photo's fade; without one
  // it simply opens the band.
  heroOverArt: {
    position: 'relative',
    marginTop: {
      default: '-8rem',
      [MD]: '-11rem',
    },
  },
  heroPlain: {
    marginTop: {
      default: '2.5rem',
      [MD]: '3.5rem',
    },
  },
  crest: {
    marginInline: 'auto',
    height: {
      default: '8rem',
      [MD]: '13rem',
    },
    width: {
      default: '8rem',
      [MD]: '13rem',
    },
    objectFit: 'contain',
    filter: 'drop-shadow(0 25px 25px rgb(0 0 0 / 0.15))',
  },
  heroName: {
    marginTop: {
      default: '1.5rem',
      [MD]: '2rem',
    },
    fontSize: 'clamp(3.75rem, 17vw, 9rem)',
    lineHeight: 0.95,
    color: tokens.paper,
  },
  // The rolling honors chip — all the lines stack in one grid cell, so the
  // chip's width is the WIDEST of them and never jumps as the text changes.
  honorRoll: {
    marginInline: 'auto',
    marginTop: {
      default: '1.5rem',
      [MD]: '1.75rem',
    },
    display: 'grid',
    width: 'fit-content',
    overflow: 'hidden',
    backgroundColor: tokens.paper,
    paddingInline: {
      default: '0.75rem',
      [MD]: '0.875rem',
    },
    paddingBlock: {
      default: '0.375rem',
      [MD]: '0.5rem',
    },
    fontSize: {
      default: '1.125rem',
      [MD]: '1.25rem',
    },
    lineHeight: '1.75rem',
    letterSpacing: '0.12em',
    color: tokens.ink,
  },
  honorLine: {
    gridColumnStart: 1,
    gridRowStart: 1,
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  // The reduced-motion row of chips. NO display here: the honor-static
  // contract in styles.css owns it (none at rest, flex under reduced
  // motion), and a compiled display would fight that swap.
  honorStatic: {
    marginTop: {
      default: '1.5rem',
      [MD]: '1.75rem',
    },
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: {
      default: '0.5rem',
      [MD]: '0.75rem',
    },
  },
  honorChip: {
    backgroundColor: tokens.paper,
    paddingInline: {
      default: '0.75rem',
      [MD]: '0.875rem',
    },
    paddingBlock: {
      default: '0.375rem',
      [MD]: '0.5rem',
    },
    fontSize: {
      default: '1.125rem',
      [MD]: '1.25rem',
    },
    lineHeight: '1.75rem',
    letterSpacing: '0.12em',
    color: tokens.ink,
  },
  commentary: {
    marginInline: 'auto',
    maxWidth: '42rem',
  },
  commentaryUnderArt: {
    marginTop: '2.5rem',
  },
  commentaryPlain: {
    marginTop: {
      default: '4rem',
      [MD]: '6rem',
    },
  },
  // The text's own measure, centered inside the figure — every decoration
  // hangs off this column rather than shifting it.
  commentaryColumn: {
    marginInline: 'auto',
    width: '100%',
    maxWidth: {
      default: '30rem',
      [MD]: '34rem',
    },
  },
  // pt clears the MARK'S INK, not its box: the 0.3 leading collapses the
  // line box to ~29px while the glyph still paints ~25px above it, so
  // without it the quote mark bleeds up into the honor chips.
  quote: {
    marginTop: 0,
    borderLeftWidth: 2,
    borderColor: tokens.pink,
    paddingTop: {
      default: '1.5rem',
      [MD]: '2rem',
    },
    paddingLeft: {
      default: '1.25rem',
      [MD]: '1.75rem',
    },
    textAlign: 'left',
    fontSize: {
      default: '1.25rem',
      [MD]: '1.5rem',
    },
    lineHeight: 1.625,
    fontWeight: 500,
    textWrap: 'pretty',
    color: 'color-mix(in srgb, var(--color-paper) 90%, transparent)',
  },
  // -ml compensates the glyph's own side bearing: aligning the BOXES
  // leaves the ink looking indented, so nudge it back to sit optically
  // flush with the first letter of the quote.
  quoteMark: {
    marginBottom: {
      default: '-0.75rem',
      [MD]: '-1rem',
    },
    marginLeft: {
      default: '-0.25rem',
      [MD]: '-0.375rem',
    },
    display: 'block',
    fontSize: {
      default: '6rem',
      [MD]: '8rem',
    },
    lineHeight: 0.3,
    color: tokens.pink,
    userSelect: 'none',
  },
  // The sign-off TUCKS UP into the quote's last line (negative margin) so
  // the portrait sits right against the text rather than floating below it.
  signoff: {
    marginTop: {
      default: '-0.5rem',
      [MD]: '-0.75rem',
    },
    display: 'flex',
    alignItems: 'center',
    gap: {
      default: '1rem',
      [MD]: '1.25rem',
    },
  },
  signoffRule: {
    height: '1px',
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    backgroundColor: tokens.paper,
  },
  signoffLockup: {
    textAlign: 'right',
  },
  signoffMasthead: {
    display: 'block',
    fontSize: {
      default: '1.25rem',
      [MD]: '1.5rem',
    },
    lineHeight: 1,
    letterSpacing: '0.12em',
    color: tokens.pink,
  },
  signoffLabel: {
    marginTop: '0.375rem',
    display: 'block',
    fontSize: {
      default: '0.875rem',
      [MD]: '1rem',
    },
    lineHeight: {
      default: '1.25rem',
      [MD]: '1.5rem',
    },
    letterSpacing: '0.25em',
    color: tokens.paper,
    textTransform: 'uppercase',
  },
  portrait: {
    display: 'flex',
    height: {
      default: '7rem',
      [MD]: '9rem',
    },
    width: {
      default: '7rem',
      [MD]: '9rem',
    },
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: '9999px',
    borderWidth: 2,
    borderColor: tokens.pink,
    backgroundColor: tokens.panel,
  },
  portraitImage: {
    height: '100%',
    width: '100%',
    objectFit: 'cover',
  },
  grainOverlay: {
    pointerEvents: 'none',
    position: 'absolute',
    inset: 0,
  },
  dataBand: {
    marginInline: 'auto',
    width: '100%',
    maxWidth: '64rem',
  },
  cupList: {
    marginTop: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
  },
  tieRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '1rem',
    borderTopWidth: {
      default: 1,
      ':first-child': 0,
    },
    paddingInline: '0.5rem',
    paddingBlock: '0.875rem',
  },
  tieUpcoming: {
    borderColor: tokens.pink,
    backgroundColor: tokens.pink,
    color: tokens.ink,
  },
  tieRest: {
    borderColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    color: tokens.ink,
  },
  tieRound: {
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
  },
  tieResult: {
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
  },
  tieResultUpcoming: {
    color: 'color-mix(in srgb, var(--color-ink) 70%, transparent)',
  },
  tieResultRest: {
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
  },
  scopeGroup: {
    marginTop: '1.5rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  scopeOption: {
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
  scopeChecked: {
    borderColor: tokens.pink,
    backgroundColor: tokens.pink,
    color: tokens.ink,
  },
  scopeRest: {
    borderColor: {
      default: 'color-mix(in srgb, var(--color-ink) 20%, transparent)',
      ':hover': tokens.pink,
    },
    color: {
      default: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
      ':hover': tokens.ink,
    },
  },
  scorersList: {
    marginTop: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
  },
  scorerRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '1.25rem',
    borderTopWidth: {
      default: 1,
      ':first-child': 0,
    },
    borderColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    paddingInline: '0.5rem',
    paddingBlock: '1rem',
  },
  scorerRank: {
    width: '2rem',
    fontSize: '1.125rem',
    lineHeight: '1.75rem',
    color: 'color-mix(in srgb, var(--color-ink) 35%, transparent)',
  },
  scorerName: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '1.5rem',
    lineHeight: '2rem',
    color: tokens.ink,
  },
  scorerGoals: {
    fontSize: '2.25rem',
    lineHeight: '2.5rem',
    color: tokens.pink,
  },
  scorersFootnote: {
    marginTop: '0.75rem',
    paddingInline: '0.5rem',
    fontSize: '10px',
    letterSpacing: '0.2em',
    color: 'color-mix(in srgb, var(--color-ink) 45%, transparent)',
    textTransform: 'uppercase',
  },
  historyGrid: {
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
  historyTick: {
    height: '0.25rem',
    width: '2.5rem',
    backgroundColor: tokens.pink,
  },
  historyValue: {
    marginTop: '0.75rem',
    fontSize: {
      default: '2.25rem',
      [MD]: '3rem',
    },
    lineHeight: {
      default: '2.5rem',
      [MD]: 1,
    },
    color: tokens.ink,
  },
  historyLabel: {
    marginTop: '0.5rem',
    fontSize: {
      default: '1.25rem',
      [MD]: '1.5rem',
    },
    lineHeight: {
      default: '1.75rem',
      [MD]: '2rem',
    },
    color: tokens.pink,
  },
  historyDetail: {
    marginTop: '0.375rem',
    fontSize: '10px',
    letterSpacing: '0.25em',
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
    textTransform: 'uppercase',
  },
  historyNote: {
    marginTop: '2rem',
    fontSize: '0.75rem',
    lineHeight: 1.625,
    color: 'color-mix(in srgb, var(--color-ink) 45%, transparent)',
  },
  wipBadge: {
    marginTop: '1rem',
    display: 'inline-block',
    borderWidth: 1,
    borderColor: 'color-mix(in srgb, var(--color-ink) 25%, transparent)',
    paddingInline: '0.75rem',
    paddingBlock: '0.375rem',
    fontSize: '10px',
    letterSpacing: '0.25em',
    color: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
    textTransform: 'uppercase',
  },
  statsGrid: {
    marginTop: '2rem',
    display: 'grid',
    columnGap: '2rem',
    rowGap: '2.5rem',
    gridTemplateColumns: {
      default: 'repeat(2, minmax(0, 1fr))',
      [LG]: 'repeat(4, minmax(0, 1fr))',
    },
  },
  statsPlaceholder: {
    height: '2.25rem',
    width: '6rem',
    backgroundColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
  },
  statsLabel: {
    marginTop: '0.75rem',
    fontSize: '10px',
    letterSpacing: '0.25em',
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
    textTransform: 'uppercase',
  },
  follow: {
    marginTop: {
      default: '5rem',
      [MD]: '6rem',
    },
    borderTopWidth: 1,
    borderColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    paddingTop: '3.5rem',
    paddingBottom: '1rem',
    textAlign: 'center',
  },
  followTitle: {
    fontSize: {
      default: '1.875rem',
      [MD]: '3rem',
    },
    lineHeight: 1.05,
    color: tokens.ink,
  },
  followSubtitle: {
    marginInline: 'auto',
    marginTop: '1rem',
    maxWidth: '28rem',
    fontSize: '0.875rem',
    lineHeight: 1.625,
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
  },
  followButton: {
    marginTop: '2rem',
    display: 'inline-block',
    cursor: 'pointer',
    paddingInline: '2.5rem',
    paddingBlock: '1rem',
    fontSize: {
      default: '1.25rem',
      [MD]: '1.5rem',
    },
    lineHeight: {
      default: '1.75rem',
      [MD]: '2rem',
    },
    letterSpacing: '0.12em',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  followOn: {
    backgroundColor: tokens.ink,
    color: tokens.paper,
  },
  followOff: {
    backgroundColor: {
      default: tokens.pink,
      ':hover': tokens.ink,
    },
    color: {
      default: tokens.ink,
      ':hover': tokens.paper,
    },
  },
});

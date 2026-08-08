import * as stylex from '@stylexjs/stylex';

import { tokens } from '../tokens.stylex';

// Styles for the clubs directory (page/clubs.ts): the immersive contenders
// hero — stage, shout, plaque, tape — the search field, and the club card
// grid.

const SM = '@media (min-width: 640px)';
const MD = '@media (min-width: 768px)';
const LG = '@media (min-width: 1024px)';
const XL = '@media (min-width: 1280px)';

export const styles = stylex.create({
  // Photoless featured clubs center their crest on the panel tone instead
  // of showing an empty frame.
  artworkFallback: {
    display: 'flex',
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.panel,
  },
  artworkLogo: {
    height: {
      default: '7rem',
      [MD]: '10rem',
    },
    width: {
      default: '7rem',
      [MD]: '10rem',
    },
    objectFit: 'contain',
  },
  artworkPhoto: {
    height: '100%',
    width: '100%',
    objectFit: 'cover',
  },
  carouselArrow: {
    display: 'flex',
    height: '2.75rem',
    width: '2.75rem',
    flexShrink: 0,
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9999px',
    borderWidth: 1,
    borderColor: {
      default: 'color-mix(in srgb, var(--color-paper) 30%, transparent)',
      ':hover': tokens.pink,
    },
    backgroundColor: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
    fontSize: '1.125rem',
    lineHeight: '1.75rem',
    color: {
      default: tokens.paper,
      ':hover': tokens.pink,
    },
    backdropFilter: 'blur(2px)',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  // The neighbors' nameplates ghost at the far sides of the plaque row —
  // desktop only, the row is too tight below `lg`.
  ghost: {
    display: {
      default: 'none',
      [LG]: 'flex',
    },
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  ghostStart: {
    alignItems: 'flex-start',
    textAlign: 'left',
  },
  ghostEnd: {
    alignItems: 'flex-end',
    textAlign: 'right',
  },
  ghostEpithet: {
    fontSize: '10px',
    lineHeight: 1,
    letterSpacing: '0.3em',
    color: 'color-mix(in srgb, var(--color-paper) 25%, transparent)',
    textTransform: 'uppercase',
  },
  ghostName: {
    fontSize: '1.875rem',
    lineHeight: 1,
    letterSpacing: '0.02em',
    color: 'color-mix(in srgb, var(--color-paper) 20%, transparent)',
  },
  marqueeRun: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    paddingRight: '1.5rem',
  },
  marqueePhrase: {
    fontSize: '1.125rem',
    lineHeight: 1,
    letterSpacing: '0.12em',
    whiteSpace: 'nowrap',
    color: tokens.ink,
  },
  marqueeStar: {
    fontSize: '0.875rem',
    lineHeight: 1,
    color: tokens.ink,
  },
  // Full-bleed ink band: the negative top margin swallows the main
  // container's top padding so the stage flows straight out of the black
  // header chrome.
  hero: {
    position: 'relative',
    marginTop: {
      default: '-2.5rem',
      [MD]: '-3.5rem',
    },
    marginInline: 'calc(50% - 50vw)',
    overflow: 'hidden',
    backgroundColor: tokens.ink,
    paddingBottom: '2rem',
  },
  heroInner: {
    position: 'relative',
    marginInline: 'auto',
    maxWidth: '80rem',
    paddingInline: {
      default: '1.25rem',
      [MD]: '2.5rem',
    },
  },
  kicker: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    paddingTop: {
      default: '2rem',
      [MD]: '2.5rem',
    },
    paddingBottom: '1.5rem',
    fontSize: {
      default: '11px',
      [MD]: '0.75rem',
    },
    lineHeight: 1,
    letterSpacing: '0.35em',
    color: 'color-mix(in srgb, var(--color-paper) 60%, transparent)',
    textTransform: 'uppercase',
  },
  stage: {
    position: 'relative',
    height: {
      default: '20rem',
      [MD]: '28rem',
    },
  },
  // The active club's name as a giant outline rising from behind the
  // artwork's top edge, through the kicker.
  shout: {
    pointerEvents: 'none',
    position: 'absolute',
    insetInline: 0,
    top: {
      default: '-4rem',
      [MD]: '-7rem',
    },
    display: 'flex',
    justifyContent: 'center',
    userSelect: 'none',
  },
  shoutName: {
    fontSize: {
      default: '7rem',
      [MD]: '15rem',
    },
    lineHeight: 1,
    whiteSpace: 'nowrap',
    color: 'transparent',
    WebkitTextStroke: '2px rgba(243, 239, 232, 0.16)',
  },
  // The previous and next artworks peek dimmed and desaturated from the
  // stage's edges, partly out of frame.
  neighbor: {
    position: 'absolute',
    top: {
      default: '2.5rem',
      [MD]: '1.5rem',
    },
    bottom: {
      default: '2.5rem',
      [MD]: '1.5rem',
    },
    width: {
      default: '16%',
      [MD]: '22%',
    },
    opacity: 0.3,
    filter: 'brightness(0.5) grayscale(100%)',
  },
  neighborLeft: {
    left: {
      default: '-8%',
      [MD]: '-14%',
    },
  },
  neighborRight: {
    right: {
      default: '-8%',
      [MD]: '-14%',
    },
  },
  frame: {
    position: 'relative',
    marginInline: 'auto',
    height: '100%',
    width: {
      default: '84%',
      [MD]: '72%',
    },
  },
  // The pink offset frame — the brutalist double-exposure edge behind the
  // active artwork.
  offsetFrame: {
    position: 'absolute',
    inset: 0,
    transform: {
      default: 'translate(0.625rem, 0.625rem)',
      [MD]: 'translate(1rem, 1rem)',
    },
    borderWidth: 2,
    borderColor: tokens.pink,
  },
  activeArtwork: {
    position: 'relative',
    display: 'block',
    height: '100%',
    width: '100%',
  },
  arrowSlot: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
  },
  arrowSlotLeft: {
    left: {
      default: 0,
      [MD]: '2%',
      [LG]: '6%',
    },
  },
  arrowSlotRight: {
    right: {
      default: 0,
      [MD]: '2%',
      [LG]: '6%',
    },
  },
  // The nameplate row overlaps the artwork's bottom edge.
  plaqueRow: {
    position: 'relative',
    zIndex: 10,
    marginTop: {
      default: '-3.5rem',
      [MD]: '-4rem',
    },
    display: 'flex',
    alignItems: 'flex-end',
    gap: '2rem',
  },
  plaque: {
    marginInline: 'auto',
    width: 'min(100%, 24rem)',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: 'color-mix(in srgb, var(--color-paper) 15%, transparent)',
    backgroundColor: tokens.ink,
    paddingInline: '2rem',
    paddingTop: '2rem',
    paddingBottom: '1.75rem',
    textAlign: 'center',
  },
  plaqueSparkRow: {
    display: 'flex',
    justifyContent: 'center',
    color: tokens.pink,
  },
  plaqueSpark: {
    fontSize: '1.5rem',
    lineHeight: 1,
  },
  plaqueEpithet: {
    marginTop: '1rem',
    fontSize: '11px',
    lineHeight: 1,
    letterSpacing: '0.3em',
    color: 'color-mix(in srgb, var(--color-paper) 70%, transparent)',
    textTransform: 'uppercase',
  },
  plaqueName: {
    marginTop: '0.75rem',
    fontSize: {
      default: '1.875rem',
      [MD]: '2.25rem',
    },
    lineHeight: 1,
    color: tokens.paper,
  },
  plaqueRule: {
    marginInline: 'auto',
    marginTop: '1.25rem',
    height: '3px',
    width: '2.5rem',
    backgroundColor: tokens.pink,
  },
  // The tilted pink tape — full-bleed and slightly rotated; the oversized
  // width hides the rotation's corner gaps.
  tape: {
    marginTop: '2.5rem',
    marginInline: '-2%',
    width: '104%',
    transform: 'rotate(-1deg)',
    backgroundColor: tokens.pink,
    paddingBlock: '0.625rem',
  },
  grainOverlay: {
    pointerEvents: 'none',
    position: 'absolute',
    inset: 0,
  },
  searchWrapper: {
    marginTop: '2.5rem',
  },
  // The field's own additions on top of the global chrome: the quiet ink
  // border that tints pink on focus, and a placeholder tuned for paper —
  // the global ::placeholder tone is set for the dark header inputs.
  searchInput: {
    width: '100%',
    borderWidth: 2,
    borderColor: {
      default: 'color-mix(in srgb, var(--color-ink) 15%, transparent)',
      ':focus': tokens.pink,
    },
    backgroundColor: 'transparent',
    paddingInline: '1.25rem',
    paddingBlock: '0.875rem',
    fontSize: '1rem',
    lineHeight: '1.5rem',
    color: tokens.ink,
    '::placeholder': {
      color: 'color-mix(in srgb, var(--color-ink) 35%, transparent)',
    },
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  emptyState: {
    marginTop: '2.5rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
  },
  grid: {
    marginTop: '2rem',
    display: 'grid',
    gap: '1.5rem',
    gridTemplateColumns: {
      default: null,
      [SM]: 'repeat(2, minmax(0, 1fr))',
      [LG]: 'repeat(3, minmax(0, 1fr))',
      [XL]: 'repeat(4, minmax(0, 1fr))',
    },
  },
  // One club card — the shared paper panel with the hover ring.
  card: {
    display: 'block',
    padding: '1.5rem',
    borderColor: {
      default: tokens.ink,
      ':hover': tokens.pink,
    },
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  cardHead: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  crest: {
    height: '3.5rem',
    width: '3.5rem',
    objectFit: 'contain',
  },
  leagueTag: {
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'color-mix(in srgb, var(--color-ink) 40%, transparent)',
  },
  cardName: {
    marginTop: '1.25rem',
    fontSize: '1.5rem',
    lineHeight: '2rem',
    color: tokens.ink,
  },
  formBar: {
    marginTop: '1rem',
    display: 'flex',
    height: '0.25rem',
    overflow: 'hidden',
  },
  formWins: {
    backgroundColor: tokens.pink,
  },
  formDraws: {
    backgroundColor: 'color-mix(in srgb, var(--color-ink) 40%, transparent)',
  },
  formLosses: {
    backgroundColor: 'color-mix(in srgb, var(--color-ink) 25%, transparent)',
  },
  formCaption: {
    marginTop: '0.5rem',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'color-mix(in srgb, var(--color-ink) 40%, transparent)',
  },
});

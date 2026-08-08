import * as stylex from '@stylexjs/stylex';

import { tokens } from '../tokens.stylex';

// Styles for the shared view helpers and the app shell (components.ts).
// Follows the translation discipline stated in shared.ts: every fontSize
// carries its Tailwind pair's lineHeight, alpha tints are color-mix fades.

const MD = '@media (min-width: 768px)';
const LG = '@media (min-width: 1024px)';

export const styles = stylex.create({
  sectionLabel: {
    fontSize: '10px',
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
  },
  pinkTick: {
    height: '0.25rem',
    width: '2.5rem',
    backgroundColor: tokens.pink,
  },
  // The pin glyph's sizes, picked per site the way the old class params were.
  pinGlyphChip: {
    height: '0.875rem',
    width: '0.875rem',
  },
  pinGlyphOverlay: {
    height: '1rem',
    width: '1rem',
  },
  pinGlyphEmpty: {
    height: '1rem',
    width: '1rem',
    flexShrink: 0,
    color: 'color-mix(in srgb, var(--color-ink) 30%, transparent)',
  },
  pinGlyphTick: {
    height: '0.875rem',
    width: '0.875rem',
    color: tokens.pink,
  },
  // The PIN control — pinned is the filled pink chip, unpinned the quiet
  // outline that fills on hover. Two disjoint looks the caller picks
  // between, same as the old two class strings.
  pinToggle: {
    display: 'flex',
    flexShrink: 0,
    cursor: 'pointer',
    alignItems: 'center',
    gap: '0.375rem',
    borderWidth: 1,
    paddingBlock: '0.375rem',
    paddingInline: '0.625rem',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  pinTogglePinned: {
    borderColor: tokens.pink,
    backgroundColor: tokens.pink,
    color: tokens.ink,
  },
  pinToggleUnpinned: {
    borderColor: {
      default: 'color-mix(in srgb, var(--color-ink) 20%, transparent)',
      ':hover': tokens.pink,
    },
    color: {
      default: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
      ':hover': tokens.ink,
    },
  },
  chipHeadingRow: {
    display: 'flex',
  },
  sparkline: {
    height: '2.5rem',
    width: '100%',
  },
  // The stage stamp — the landing header's pink chip device, always two
  // lines here (see the note at the view).
  previewStamp: {
    fontFamily: tokens.fontBody,
    fontSize: {
      default: '9px',
      [MD]: '10px',
    },
    lineHeight: 1.9,
    letterSpacing: '0.2em',
    whiteSpace: 'nowrap',
    color: tokens.ink,
    textTransform: 'uppercase',
    userSelect: 'none',
  },
  previewStampChip: {
    // Chromium still wants the -webkit- prefix here, and StyleX does not
    // auto-prefix — both spellings, like the old utility emitted.
    WebkitBoxDecorationBreak: 'clone',
    boxDecorationBreak: 'clone',
    backgroundColor: tokens.pink,
    paddingInline: '0.375rem',
    paddingBlock: '0.125rem',
  },
  personGlyph: {
    height: '1.1rem',
    width: '1.1rem',
  },
  accountButton: {
    display: 'flex',
    flexShrink: 0,
    cursor: 'pointer',
    alignItems: 'center',
    gap: '0.75rem',
  },
  // The circle and the label react to the button's hover through the
  // hover-card contract classes in styles.css (StyleX has no descendant
  // selectors) — only their resting looks live here.
  accountCircle: {
    display: 'flex',
    height: '2.25rem',
    width: '2.25rem',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9999px',
    borderWidth: 1,
    borderColor: 'color-mix(in srgb, var(--color-paper) 15%, transparent)',
    color: 'color-mix(in srgb, var(--color-paper) 60%, transparent)',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  accountLabel: {
    display: {
      default: 'none',
      [MD]: 'inline',
    },
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'color-mix(in srgb, var(--color-paper) 60%, transparent)',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  navIcon: {
    height: '22px',
    width: '22px',
    display: {
      default: 'block',
      [MD]: 'none',
    },
  },
  // HER GAME — the featured center tab (see the view for the states).
  featuredTab: {
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'center',
    paddingInline: {
      default: '0.875rem',
      [MD]: '1rem',
      [LG]: '1.25rem',
    },
    paddingBlock: {
      default: '0.5rem',
      [MD]: '0.625rem',
    },
    fontSize: {
      default: 'min(14px, 3.4vw)',
      [MD]: '0.875rem',
      [LG]: '1rem',
    },
    lineHeight: {
      default: 0.92,
      [MD]: '1.25rem',
      [LG]: '1.5rem',
    },
    letterSpacing: {
      default: '0.08em',
      [MD]: '0.14em',
    },
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    color: tokens.ink,
  },
  featuredTabActive: {
    backgroundColor: tokens.pink,
  },
  featuredTabRest: {
    backgroundColor: {
      default: tokens.paper,
      ':hover': tokens.pink,
    },
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    borderBottomWidth: 2,
    paddingInline: {
      default: '0.5rem',
      [MD]: '0.625rem',
      [LG]: '1rem',
    },
    paddingBlock: '0.75rem',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    fontSize: {
      default: null,
      [MD]: '11px',
      [LG]: '0.75rem',
    },
    lineHeight: {
      default: null,
      [LG]: '1rem',
    },
    letterSpacing: {
      default: null,
      [MD]: '0.12em',
      [LG]: '0.2em',
    },
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  navLinkActive: {
    borderColor: tokens.pink,
    color: tokens.pink,
  },
  navLinkRest: {
    borderColor: 'transparent',
    color: {
      default: tokens.paper,
      ':hover': tokens.pink,
    },
  },
  navLabel: {
    display: {
      default: 'none',
      [MD]: 'block',
    },
  },
  header: {
    position: 'fixed',
    insetInline: 0,
    top: 0,
    zIndex: 50,
    borderBottomWidth: 1,
    borderColor: 'color-mix(in srgb, var(--color-paper) 10%, transparent)',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    color: tokens.paper,
    backdropFilter: 'blur(8px)',
  },
  headerBar: {
    position: 'relative',
    marginInline: 'auto',
    display: 'flex',
    height: {
      default: '3.5rem',
      [MD]: '4rem',
    },
    width: '100%',
    maxWidth: '80rem',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    paddingInline: {
      default: '1.25rem',
      [MD]: '2.5rem',
    },
  },
  brandGroup: {
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    gap: '0.75rem',
  },
  brandLink: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.75rem',
    fontSize: {
      default: '1.5rem',
      [MD]: '1.875rem',
    },
    lineHeight: {
      default: '2rem',
      [MD]: '2.25rem',
    },
    letterSpacing: '0.025em',
    color: {
      default: tokens.paper,
      ':hover': tokens.pink,
    },
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.3s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  brandDot: {
    color: tokens.pink,
  },
  sectionRail: {
    marginInline: 'auto',
    display: 'flex',
    width: '100%',
    maxWidth: '80rem',
    alignItems: 'center',
    overflowX: 'auto',
    paddingInline: {
      default: '0.5rem',
      [MD]: '1.5rem',
    },
  },
  sectionRailGrid: {
    marginInline: 'auto',
    display: 'grid',
    width: '100%',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) auto minmax(0, 1fr) minmax(0, 1fr)',
    alignItems: 'center',
    justifyItems: 'center',
    maxWidth: {
      default: null,
      [MD]: '56rem',
    },
  },
  drawnArrowInline: {
    display: 'inline-block',
    height: '0.72em',
    width: 'auto',
  },
  drawnTimes: {
    marginBottom: '0.11em',
    display: 'inline-block',
    height: '0.52em',
    width: 'auto',
  },
  timesCountSpacing: {
    marginLeft: '0.04em',
    marginRight: '0.26em',
  },
  clubChipLink: {
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: {
      default: null,
      ':hover': tokens.ink,
    },
    color: {
      default: null,
      ':hover': tokens.paper,
    },
  },
  clubSection: {
    marginTop: {
      default: '4rem',
      [MD]: '5rem',
    },
    scrollMarginTop: {
      default: '7rem',
      [MD]: '8rem',
    },
  },
  clubSectionHeading: {
    display: 'flex',
  },
  screenChip: {
    display: 'inline-block',
    backgroundColor: tokens.pink,
    paddingInline: '0.75rem',
    paddingBlock: '0.375rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    letterSpacing: '0.2em',
    color: tokens.ink,
  },
  screenTitle: {
    marginTop: '1.5rem',
    fontSize: {
      default: '3rem',
      [MD]: '4.5rem',
    },
    lineHeight: 1,
    color: tokens.ink,
  },
  screenSubtitle: {
    marginTop: '0.75rem',
    maxWidth: '42rem',
    fontSize: '0.875rem',
    lineHeight: 1.625,
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
  },
  tickerSpark: {
    display: 'inline-block',
    height: '0.55em',
    width: 'auto',
    flexShrink: 0,
    color: tokens.pink,
  },
  tapeArrow: {
    display: 'inline-block',
    height: '0.5em',
    width: 'auto',
    flexShrink: 0,
  },
});

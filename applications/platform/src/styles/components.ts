import * as stylex from '@stylexjs/stylex';

import { tokens } from '../tokens.stylex';

// Styles for the shared view helpers and the app shell (components.ts).
// Follows the translation discipline stated in shared.ts: every fontSize
// carries its Tailwind pair's lineHeight, alpha tints are color-mix fades.

// One size for every mark in the tab row — the four drawn glyphs and the brand
// illustration alike. They share it so the five tabs keep one height, and it is
// what the illustration needs to read as a mark rather than as a dot.
const ICON_SIZE = '26px';

// How far the tape's rise/fall mark drops to sit on the numerals' own centre
// rather than their line box's. Measured against the rendered tape, in em so
// it holds at any size the tape is set at.
const TAPE_ARROW_SHIFT = '-0.0625em';

const XS = '@media (min-width: 360px)';
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
  // The circle and the label react to the button's hover through the
  // hover-card contract classes in styles.css (StyleX has no descendant
  // selectors) — only their resting looks live here.
  // The mark occupies the drawn glyphs' box exactly, so all five tabs share one
  // geometry and one baseline. The paper disc is the white the artwork was
  // drawn on; the mark's own ink ring covers its edge, so the two read as one
  // badge rather than as a logo sitting on a circle.
  brandMark: {
    display: {
      default: 'block',
      [MD]: 'none',
    },
    height: ICON_SIZE,
    width: ICON_SIZE,
    backgroundColor: tokens.paper,
    borderRadius: '9999px',
  },
  // Open, the mark takes a RING and nothing else. Filling the disc instead put
  // accent through every transparent part of the artwork, the face included,
  // so the illustration read as a pink silhouette. The ring is a shadow rather
  // than a border so it costs no layout: a border would take its width out of
  // the image's own box and the mark would shrink as the tab opened.
  brandMarkActive: {
    boxShadow: `0 0 0 2px ${tokens.pink}`,
  },
  navIcon: {
    height: ICON_SIZE,
    width: ICON_SIZE,
    display: {
      default: 'block',
      [MD]: 'none',
    },
  },
  // HER GAME — the featured center tab (see the view for the states).

  navLink: {
    display: 'flex',
    // Below `md` a tab is a glyph over its label, so it stacks; from `md` the glyph is gone and the label sits alone on the line.
    flexDirection: {
      default: 'column',
      [MD]: 'row',
    },
    alignItems: 'center',
    justifyContent: 'center',
    gap: {
      default: '0.25rem',
      [MD]: null,
    },
    // A touch target of 44 CSS pixels, the floor for a control a thumb has to hit.
    minHeight: {
      default: '44px',
      [MD]: null,
    },
    borderBottomWidth: 2,
    // Five labelled tabs share 304px at the narrowest supported viewport, so the horizontal padding on each is what the widest label spends its room on.
    paddingInline: {
      default: '0.125rem',
      [XS]: '0.25rem',
      [MD]: '0.625rem',
      [LG]: '1rem',
    },
    paddingBlock: {
      default: '0.375rem',
      [MD]: '0.75rem',
    },
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
    // The phone rail's own rung of the label scale: the meta size, with the meta tracking held as far down as five tabs on a 320px screen allow.
    fontSize: {
      default: '9px',
      [XS]: '10px',
      [MD]: null,
    },
    letterSpacing: {
      default: '0.12em',
      [XS]: '0.2em',
      [MD]: null,
    },
    lineHeight: {
      default: 1,
      [MD]: null,
    },
  },
  navLabelPhone: {
    display: {
      default: 'block',
      [MD]: 'none',
    },
  },
  navLabelWide: {
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
  sectionRail: {
    marginInline: 'auto',
    display: 'flex',
    width: '100%',
    maxWidth: '80rem',
    alignItems: 'center',
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
  // RESTING look only. Two things had to be learned the hard way here.
  //
  // First, a conditional value REPLACES the property rather than layering on
  // what an earlier style set, so the `default: null` this used to carry did
  // not mean "leave the chip's fill alone" — it deleted it, and every
  // anchoring chip on the club profile rendered as bare ink text on paper.
  //
  // Second, the hover itself cannot live here. It has to be gated behind
  // `@media (hover: hover)` or a TAP leaves the chip stuck in its pressed
  // colours, and StyleX silently drops that media query when it is nested
  // inside a conditional value — no error, just no rule. The hover is a
  // `.chip-anchor` contract in styles.css instead.
  clubChipLink: {
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: tokens.pink,
    color: tokens.ink,
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
    height: '0.85em',
    width: 'auto',
    flexShrink: 0,
    color: tokens.pink,
  },
  // A flex row centres a mark on its LINE box, and a line box is taller than
  // the digits inside it — the space a descender would use sits under them, so
  // a mark centred that way rides high of the numerals it belongs to. The
  // nudge is the measured distance between the two centres, and it is written
  // in em so it holds at any tape size.
  tapeArrow: {
    display: 'inline-block',
    height: '0.5em',
    width: 'auto',
    flexShrink: 0,
  },
  // Both directions carry the same nudge; the fall applies it before the flip,
  // so the two land on one axis rather than mirroring the correction too.
  tapeArrowUp: {
    transform: `translateY(${TAPE_ARROW_SHIFT})`,
  },
  tapeArrowDown: {
    transform: `translateY(${TAPE_ARROW_SHIFT}) scaleY(-1)`,
  },
  // ONE optical size for the chevron wherever it appears, so the mark beside
  // a 10px breadcrumb and the one beside the season value carry the same
  // stroke weight. Fixed rather than `em` for that reason: em would scale
  // the stroke with whatever type it sat next to, which is how the two
  // drifted apart in the first place.
  chevron: {
    height: '1.125rem',
    width: '1.125rem',
    flexShrink: 0,
    color: tokens.pink,
  },
  chevronLeft: {
    transform: 'rotate(90deg)',
  },
});

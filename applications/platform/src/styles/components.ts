import * as stylex from '@stylexjs/stylex';

import { spacing, tokens, type } from '../tokens.stylex';

// Styles for the shared view helpers and the app shell (components.ts).
// Follows the translation discipline stated in shared.ts: every fontSize
// carries its Tailwind pair's lineHeight, alpha tints are color-mix fades.

// One box for every mark in the tab row, so the five tabs keep one height and
// one optical weight.
const ICON_SIZE = '24px';

// The chrome material: how opaque its ink is, and what it does to the page behind it. 0.76 is as
// translucent as the chrome gets while everything on it still clears AA over the brightest page that
// can pass underneath, pure white: paper text 9.5:1, the muted labels 4.7:1, and the pink active
// icon and underline 3.1:1 (non-text, 3:1). At 0.75 the pink fell to 2.998:1 over white. Over plain
// paper the same figures are 10.0, 5.0 and 3.3; over a pink chip 14.8, 7.4 and 4.9. The active nav
// label is paper rather than pink because pink TEXT needs 4.5:1, which takes 0.87 over white,
// and 0.9 already read as solid; the pink icon and underline carry the active state instead.
const CHROME_INK_OPACITY = 0.76;
const CHROME_BACKDROP = 'blur(24px) saturate(180%)';

// A profile identity line's name size, which its back arrow is set against.
const IDENTITY_TITLE_SIZE = { phone: '2rem', md: '2.5rem' } as const;

/**
 * A crest's box in a profile's identity line, and so the width its image is drawn at.
 */
export const IDENTITY_CREST_SIZE = '2rem';

// How far the tape's rise/fall mark drops to sit on the numerals' own centre
// rather than their line box's. Measured against the rendered tape, in em so
// it holds at any size the tape is set at.
const TAPE_ARROW_SHIFT = '-0.0625em';

const MD = '@media (min-width: 768px)';
const LG = '@media (min-width: 1024px)';

export const styles = stylex.create({
  sectionLabel: {
    fontSize: type.metaSize,
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
    fontSize: type.metaSize,
    letterSpacing: type.metaTracking,
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
  navIcon: {
    height: ICON_SIZE,
    width: ICON_SIZE,
    flexShrink: 0,
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
    justifyContent: { default: 'flex-start', [MD]: 'center' },
    gap: {
      default: '0.25rem',
      [MD]: null,
    },
    // A touch target of 44 CSS pixels, the floor for a control a thumb has to hit.
    minHeight: '44px',
    minWidth: 0,
    width: '100%',
    borderBottomWidth: 2,
    // Compact padding keeps all five labels readable at 320px.
    paddingInline: {
      default: 0,
      [MD]: '0.625rem',
      [LG]: '1rem',
    },
    paddingBlock: {
      default: '0.375rem',
      [MD]: '0.75rem',
    },
    whiteSpace: 'normal',
    textAlign: 'center',
    overflowWrap: 'anywhere',
    textTransform: 'uppercase',
    fontSize: {
      default: null,
      [MD]: '0.6875rem',
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
  // Active, the label is paper and the pink moves to the marks around it: the icon and the underline
  // are non-text and hold 3:1 on the translucent chrome, where pink text would not hold 4.5:1.
  navLinkActive: {
    borderColor: tokens.pink,
    color: tokens.paper,
  },
  navIconActive: {
    color: tokens.pink,
  },
  // At rest a tab is the muted grey (4.7:1 at worst on the translucent chrome; see
  // CHROME_INK_OPACITY); pressed it brightens toward paper, and hovered it takes the accent.
  navLinkRest: {
    borderColor: 'transparent',
    color: {
      default: tokens.muted,
      ':hover': tokens.pink,
      ':active': 'color-mix(in srgb, var(--color-paper) 70%, transparent)',
    },
  },
  navLabel: {
    // 11px at the default root size; rem units follow the reader's text size.
    fontSize: {
      default: '0.6875rem',
      [MD]: null,
    },
    // Close tracking leaves room for the labels without clipping destinations.
    letterSpacing: {
      default: '0.02em',
      [MD]: null,
    },
    lineHeight: {
      default: 1.25,
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
  // The chrome material the header and a profile's identity bar share: translucent ink over the page, blurred wide and saturated so what passes underneath dissolves into soft colour rather than showing as shapes; at 8px a pink chip still read as a dark blotch. The hairline TERMINATES the blur, which samples past the element's own box and would otherwise smear a bright backdrop into a soft halo under the edge.
  chrome: {
    borderBottomWidth: 1,
    borderColor: 'color-mix(in srgb, var(--color-paper) 10%, transparent)',
    backgroundColor: `rgba(0, 0, 0, ${CHROME_INK_OPACITY})`,
    color: tokens.paper,
    WebkitBackdropFilter: CHROME_BACKDROP,
    backdropFilter: CHROME_BACKDROP,
  },
  header: {
    position: 'fixed',
    insetInline: 0,
    top: 0,
    zIndex: 50,
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
  // The back link: the ink scrim at 60% is the anchor's own box, 44px each
  // way at the least with the text inset by `xs`, square-cornered like every
  // chip on the platform. Paper meta type on it reads on any photo.
  sectionRailGrid: {
    marginInline: 'auto',
    display: 'grid',
    width: '100%',
    // Reflow into fewer columns when the reader enlarges text.
    gridTemplateColumns: 'repeat(auto-fit, minmax(3rem, 1fr))',
    alignItems: 'stretch',
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
  // The back link's row: the arrow and the label, centered on each other.
  backLink: {
    gap: spacing.xs,
  },
  // The back arrow at about the display face's cap height, so its shaft sits on the caps' optical center.
  backArrow: {
    flexShrink: 0,
    height: '0.75em',
    width: '1em',
  },
  // A profile's identity line: `--profile-bar-height` tall whatever the name, so the photo under it starts on one y for every profile, and the offsets that clear the bar read the same value.
  identityLine: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    height: 'var(--profile-bar-height)',
  },
  identityCrest: {
    flexShrink: 0,
    height: IDENTITY_CREST_SIZE,
    width: IDENTITY_CREST_SIZE,
    objectFit: 'contain',
  },
  // The icon-only way back: a 44px target, paper at rest, pink under the pointer and under keyboard focus.
  identityBack: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    height: '2.75rem',
    width: '2.75rem',
    fontSize: {
      default: IDENTITY_TITLE_SIZE.phone,
      [MD]: IDENTITY_TITLE_SIZE.md,
    },
    color: {
      default: tokens.paper,
      ':hover': tokens.pink,
      ':focus-visible': tokens.pink,
    },
    transitionProperty: 'color',
    transitionDuration: '0.3s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  // The back arrow at the name's cap height: the display face's caps stand 0.859em, and the link carries the name's own size. The arrow's 4:3 box is capped at the target's width, which it would pass from md.
  identityArrow: {
    '--drawn-arrow-direction': -1,
    height: '0.859em',
    width: 'auto',
    maxWidth: '100%',
  },
  // The name on one line. The clip is a guard for enlarged text only; at the default size the caller's name already fits.
  identityTitle: {
    minWidth: 0,
    // Tall enough for the accents over the capitals (Í, Á, Ň): the display face's own 0.92 leading ends at the cap line, and the clip would cut everything above it.
    lineHeight: 1.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: {
      default: IDENTITY_TITLE_SIZE.phone,
      [MD]: IDENTITY_TITLE_SIZE.md,
    },
    color: tokens.paper,
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
      default: spacing.section,
      [MD]: '5rem',
    },
    // Measured navigation heights also clear headings when text is enlarged.
    scrollMarginTop: {
      default: 'calc(var(--profile-offset) + var(--section-rail-height, 3.8125rem) + 0.5rem)',
      [MD]: 'calc(var(--profile-offset) + 4.9375rem)',
    },
  },
  clubSectionHeading: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: '1rem',
    rowGap: spacing.xs,
  },
  clubSectionTitle: {
    minWidth: 0,
    maxWidth: '100%',
    display: 'flex',
    flexShrink: 1,
  },
  // The heading-row control — a toggle or a link out — as plain meta text in the muted ink, right-aligned and free to wrap. The 44px hit area comes from padding alone: a drawn box was one more rectangle per section and wrapped the heading row on phones. The side padding is cancelled by a negative margin so the text stays flush with the column's edge.
  clubSectionControl: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    marginLeft: 'auto',
    minHeight: '2.75rem',
    paddingInline: '0.5rem',
    marginRight: '-0.5rem',
    cursor: 'pointer',
    textAlign: 'right',
    fontSize: type.metaSize,
    letterSpacing: type.metaTracking,
    textTransform: 'uppercase',
    color: {
      default: tokens.mutedInk,
      ':hover': tokens.ink,
    },
    transitionProperty: 'color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  // The jump row. On a phone it is a bar pinned flush under the header and the profile's identity bar — at `--profile-offset` — on opaque paper, bleeding to the screen's edges, its chips scrolling as one line so one peeks in from the right. From md it is a static, wrapped block.
  sectionIndex: {
    // Reserve the separator before sticking so anchor targets do not shift.
    borderBottomWidth: { default: 1, [MD]: 0 },
    borderColor: 'transparent',
    position: {
      default: 'sticky',
      [MD]: 'static',
    },
    top: {
      default: 'var(--profile-offset)',
      [MD]: 'auto',
    },
    zIndex: 40,
    marginTop: spacing.lg,
    marginInline: {
      default: '-1.25rem',
      [MD]: 0,
    },
    paddingBlock: {
      default: '0.5rem',
      [MD]: 0,
    },
    backgroundColor: {
      default: tokens.paper,
      [MD]: 'transparent',
    },
  },
  // Pinned, the row draws the one hairline under itself. No shadow: the platform casts none.
  sectionIndexStuck: {
    borderBottomWidth: {
      default: 1,
      [MD]: 0,
    },
    borderColor: tokens.hairline,
  },
  // The scroller clips at the screen's edge and carries the column's padding inside itself. Its END is a 24px fade from clear to paper that STICKS to the scroller's right edge: while chips are cut off there it lies over the cut, saying there is more; scrolled to the end it is back in its own place after the last chip, over nothing, and the row simply ends. No script, no measuring. Gone from md, where the row wraps instead of scrolling.
  sectionIndexList: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: {
      default: 'nowrap',
      [MD]: 'wrap',
    },
    overflowX: {
      default: 'auto',
      [MD]: 'visible',
    },
    paddingInline: {
      default: '1.25rem',
      [MD]: 0,
    },
    scrollPaddingInline: '1.25rem',
    '::after': {
      content: '""',
      display: {
        default: 'block',
        [MD]: 'none',
      },
      position: 'sticky',
      right: 0,
      flexShrink: 0,
      width: '1.5rem',
      marginLeft: '-0.5rem',
      pointerEvents: 'none',
      backgroundImage: 'linear-gradient(to right, transparent, var(--color-paper))',
    },
  },
  // The chip of the section in view: ink type, the hairline kept on its
  // top and sides, and only the bottom stroke replaced by 2px of the live
  // pink. The chip keeps its 44px box, since the border sits inside it.
  sectionIndexLinkActive: {
    borderBottomWidth: 2,
    borderBottomColor: tokens.pinkLive,
    color: tokens.ink,
  },
  // A chip: the hairline outline, meta type in the muted ink, 44px tall for
  // the thumb; pressed it takes the surface tone.
  sectionIndexLink: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '2.75rem',
    whiteSpace: 'nowrap',
    borderWidth: 1,
    paddingInline: '0.875rem',
    fontSize: type.metaSize,
    letterSpacing: type.metaTracking,
    textTransform: 'uppercase',
    borderColor: {
      default: tokens.hairline,
      ':hover': tokens.pink,
    },
    color: {
      default: tokens.mutedInk,
      ':hover': tokens.ink,
    },
    backgroundColor: {
      default: 'transparent',
      ':active': tokens.surface,
    },
    transitionProperty: 'color, border-color, background-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
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
  // an 11px breadcrumb and the one beside the season value carry the same
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

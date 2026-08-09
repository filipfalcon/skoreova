import * as stylex from '@stylexjs/stylex';

import { tokens, type } from '../tokens.stylex';

// The cross-module primitives every screen composes from — the StyleX form
// of what used to be the `display` class and the shared class-string
// constants (`panel`, `CHIP_CLASS`, `CLUB_CHIP`).
//
// TRANSLATION DISCIPLINE, for every style in src/styles/: the old Tailwind
// text-* utilities set line-height alongside font-size, and they sat in the
// utilities layer, so they BEAT the `.display` component class's 0.92 —
// what rendered was the utility's pair. A migrated style that states a
// fontSize therefore always states the Tailwind pair's lineHeight too
// (xs 1rem, sm 1.25rem, base 1.5rem, lg 1.75rem, xl 1.75rem, 2xl 2rem,
// 3xl 2.25rem, 4xl 2.5rem, 5xl+ 1), unless the site carried an explicit
// leading-* — then that one. Alpha tints are written as
// `color-mix(in srgb, var(--color-*) N%, transparent)`, the same fade the
// old /N modifiers produced.
export const shared = stylex.create({
  // The display voice — Anton, uppercase, tight. The 0.92 line-height and
  // -0.01em tracking are the DEFAULTS the old class only got to keep where
  // no utility overrode them; site styles merged after this one override
  // per property, which is the same cascade the layers used to run.
  display: {
    fontFamily: tokens.fontDisplay,
    textTransform: 'uppercase',
    lineHeight: 0.92,
    letterSpacing: '-0.01em',
  },
  // META TEXT — the quiet uppercase voice: breadcrumbs, the hero subtitle,
  // and the base the season selector's value composes on top of. One size
  // and one tracking, matching the app's 10px label scale, so nothing in a
  // meta row can be a step larger than its neighbours by accident. The
  // muted grey is the token, not a per-site mix of paper.
  //
  // Compose, never copy: a site that needs a different color or weight
  // spreads this first and overrides the one property (see the season
  // value, which is this plus paper plus a bold weight).
  metaText: {
    fontSize: type.metaSize,
    lineHeight: 1.6,
    letterSpacing: type.metaTracking,
    textTransform: 'uppercase',
    color: tokens.muted,
  },
  // Visually hidden, reachable by assistive tech — the sr-only recipe.
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    borderWidth: 0,
  },
  // The paper panel — the app's card frame.
  panel: {
    borderWidth: 2,
    borderColor: tokens.ink,
    backgroundColor: tokens.paper,
  },
  // The section chip — the shared heading grammar (filled pink block).
  chip: {
    display: 'inline-block',
    backgroundColor: tokens.pink,
    paddingBlock: '0.5rem',
    paddingInline: {
      default: '1rem',
      '@media (min-width: 768px)': '1.25rem',
    },
    fontSize: {
      default: '1.25rem',
      '@media (min-width: 768px)': '1.5rem',
    },
    lineHeight: {
      default: '1.75rem',
      '@media (min-width: 768px)': '2rem',
    },
    letterSpacing: '0.2em',
    color: tokens.ink,
  },
  // The club profile's section chip — the same block, flex so the anchor
  // can carry a gap between text and a future glyph.
  clubChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.625rem',
    backgroundColor: tokens.pink,
    paddingBlock: '0.5rem',
    paddingInline: {
      default: '1rem',
      '@media (min-width: 768px)': '1.25rem',
    },
    fontSize: {
      default: '1.25rem',
      '@media (min-width: 768px)': '1.5rem',
    },
    lineHeight: {
      default: '1.75rem',
      '@media (min-width: 768px)': '2rem',
    },
    letterSpacing: '0.2em',
    color: tokens.ink,
  },
});

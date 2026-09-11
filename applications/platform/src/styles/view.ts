import * as stylex from '@stylexjs/stylex';

import { spacing, tokens } from '../tokens.stylex';

// Styles for the app shell (view.ts): the page wrapper, the header spacer,
// the main column, and the footer.

const MD = '@media (min-width: 768px)';

export const styles = stylex.create({
  page: {
    backgroundColor: tokens.paper,
    fontFamily: tokens.fontBody,
    color: tokens.ink,
  },
  shell: {
    minHeight: '100vh',
  },
  // A BLACK spacer clears the fixed header (bar + section rail) instead
  // of padding: the translucent header must rest on black, not on the
  // paper page — content still slides beneath the blur once you scroll.
  headerSpacer: {
    // The row of tabs and the hairline under it. Below `md` a tab stacks a glyph over its label, which is what makes the phone header the taller of the two.
    height: 'var(--header-height)',
    backgroundColor: 'black',
  },
  main: {
    marginInline: 'auto',
    width: '100%',
    maxWidth: '80rem',
    paddingInline: {
      default: '1.25rem',
      [MD]: '2.5rem',
    },
    paddingTop: {
      default: '2.5rem',
      [MD]: '3.5rem',
    },
    paddingBottom: '2.5rem',
  },
  footer: {
    marginInline: 'auto',
    display: 'flex',
    width: '100%',
    maxWidth: '80rem',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    columnGap: '1.5rem',
    rowGap: '0.5rem',
    borderTopWidth: 1,
    borderColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    paddingInline: {
      default: '1.25rem',
      [MD]: '2.5rem',
    },
    paddingBlock: '1.5rem',
  },
  footerNote: {
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'color-mix(in srgb, var(--color-ink) 30%, transparent)',
  },
  cookieLink: {
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: {
      default: 'color-mix(in srgb, var(--color-ink) 30%, transparent)',
      ':hover': tokens.ink,
    },
    textDecorationLine: 'underline',
    textDecorationColor: tokens.pink,
    textDecorationThickness: '2px',
    textUnderlineOffset: '4px',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.3s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  // The toast stack: the library pins it to the bottom centre; this keeps it
  // clear of the phone's home bar and out of the way of every tap it does
  // not receive.
  toastStack: {
    zIndex: 60,
    margin: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.xs,
    paddingInline: spacing.md,
    paddingBottom: `calc(${spacing.md} + env(safe-area-inset-bottom))`,
    pointerEvents: 'none',
  },
  // One toast: a line of paper on the lifted ink, square-cornered and unshadowed like every other block on the platform.
  toast: {
    backgroundColor: tokens.inkLift,
    color: tokens.paper,
    paddingInline: spacing.md,
    paddingBlock: spacing.sm,
    fontSize: '0.875rem',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
  },
});

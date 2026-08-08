import * as stylex from '@stylexjs/stylex';

import { tokens } from '../tokens.stylex';

// Styles for the app shell (view.ts): the page wrapper, the header spacer,
// the main column, and the footer.

const MD = '@media (min-width: 768px)';
const LG = '@media (min-width: 1024px)';

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
    height: {
      default: '104px',
      [MD]: '107px',
      [LG]: '108px',
    },
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
});

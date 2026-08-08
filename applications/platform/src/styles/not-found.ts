import * as stylex from '@stylexjs/stylex';

import { tokens } from '../tokens.stylex';

// The 404 screen — the screenHeader anatomy (chip, display title, quiet
// subtitle) with the one action home.

export const styles = stylex.create({
  chipRow: {
    display: 'flex',
  },
  chip: {
    display: 'inline-block',
    backgroundColor: tokens.pink,
    paddingBlock: '0.375rem',
    paddingInline: '0.75rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    letterSpacing: '0.2em',
    color: tokens.ink,
  },
  title: {
    marginTop: '1.5rem',
    fontSize: {
      default: '3rem',
      '@media (min-width: 768px)': '4.5rem',
    },
    lineHeight: 1,
    color: tokens.ink,
  },
  subtitle: {
    marginTop: '0.75rem',
    maxWidth: '42rem',
    fontSize: '0.875rem',
    lineHeight: 1.625,
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
  },
  homeLink: {
    marginTop: '2rem',
    display: 'inline-block',
    borderWidth: 2,
    borderColor: tokens.ink,
    paddingBlock: '0.625rem',
    paddingInline: '1.25rem',
    fontSize: '0.75rem',
    lineHeight: '1rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: {
      default: tokens.ink,
      ':hover': tokens.paper,
    },
    backgroundColor: {
      default: 'transparent',
      ':hover': tokens.ink,
    },
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.3s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
});

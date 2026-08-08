import * as stylex from '@stylexjs/stylex';

// Design tokens — typed StyleX handles over the palette. StyleX requires
// defineVars to sit in a `.stylex.ts` file that exports only variable groups.
//
// The RAW values live in styles.css's `:root` block, not here: the global
// stylesheet (ticker, honor roll, focus ring, consent banner tones) reads
// `var(--color-*)` by name and cannot reach StyleX's hashed variables, so the
// custom properties are the one place a hex value is written and these tokens
// alias them. Alpha tints (`text-ink/50` in the old Tailwind vocabulary) are
// written at the point of use as `color-mix(in srgb, var(--color-*) N%,
// transparent)` rather than pre-minted here — the app uses dozens of steps,
// and a token per step would just be the utility scale rebuilt by hand.
export const tokens = stylex.defineVars({
  ink: 'var(--color-ink)',
  panel: 'var(--color-panel)',
  paper: 'var(--color-paper)',
  pink: 'var(--color-pink)',
  rise: 'var(--color-rise)',
  fall: 'var(--color-fall)',
  ucl: 'var(--color-ucl)',
  uec: 'var(--color-uec)',
  drop: 'var(--color-drop)',
  uecInk: 'var(--color-uec-ink)',
  riseInk: 'var(--color-rise-ink)',
  fontDisplay: 'var(--font-display)',
  fontBody: 'var(--font-body)',
});

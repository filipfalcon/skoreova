import * as stylex from '@stylexjs/stylex';

/**
 * The hero's own values.
 *
 * `scrim-opacity` is the opacity of the scrim role behind the headline. The scrim protects the
 * headline only, as WCAG 1.4.3 measures text against its own background and Material 3 protects
 * text rather than dimming an image: it is the least opacity, in thousandths, at which every glyph
 * of the headline's plain lines keeps 3:1 for large text against the ground beside it, with the
 * photo at pure white, its brightest, and the neon's glow lit over both lines. On-surface at 3:1
 * over white under black alone needs 0.492; the glow, lightening both glyph and ground, raises it
 * to 0.740 in one engine and 0.791 in the other, where the least ratio at 0.791 is 3.00:1.
 * src/section/hero.browser.test.ts recomputes it from the painted page.
 *
 * `--hero-glow-reach` is the neon glow's widest drop-shadow radius, in em of the headline, and the
 * distance over which the scrim fades out above and below the headline. Its name is literal, so the
 * glow's stylesheet reads it with `var()`.
 */
export const hero = stylex.defineVars({
  'scrim-opacity': '0.791',
  '--hero-glow-reach': '1.3em',
});

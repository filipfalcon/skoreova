import * as stylex from '@stylexjs/stylex';

/**
 * The hero's own type values.
 *
 * `headline-pitch` is the headline's line pitch, baseline to baseline, in em at the monument cut,
 * derived from its own text so the space between its lines equals the space between its letters.
 * The ink of adjacent lines comes no closer than 0.012em of descent above 0.702em of ascent,
 * 0.714em; the mean ink-to-ink gap of its 19 adjacent letter pairs, caps tracking included, is
 * 0.106em; 0.714 + 0.106 = 0.820em. Measured in the browser, the larger of two engines;
 * src/section/hero.browser.test.ts recomputes it from the headline.
 */
export const hero = stylex.defineVars({
  'headline-pitch': '0.82',
});

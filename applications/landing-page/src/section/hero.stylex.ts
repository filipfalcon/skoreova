import * as stylex from '@stylexjs/stylex';

/**
 * The hero's own type values.
 *
 * `headline-pitch` is the headline's line pitch, baseline to baseline, in em in the brand face,
 * derived from its own text so the space between its lines equals the space between its letters.
 * The ink of adjacent lines comes no closer than 0.008em of descent above 0.868em of ascent,
 * 0.876em; the mean ink-to-ink gap of its 19 adjacent letter pairs, caps tracking included, is
 * 0.105em; 0.876 + 0.105 = 0.981em. Measured in the browser, the larger of two engines;
 * src/section/hero.browser.test.ts recomputes it from the headline.
 */
export const hero = stylex.defineVars({
  'headline-pitch': '0.981',
});

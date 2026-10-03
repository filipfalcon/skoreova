import * as stylex from '@stylexjs/stylex';

/**
 * The hero's own type values.
 *
 * `headline-pitch` is the headline's line pitch, baseline to baseline, in em in the brand face,
 * derived from its own text so the space between its lines equals the space between its words,
 * which is wider than the space between its letters: letters group into words, words into lines
 * (Bringhurst). The ink of adjacent lines comes no closer than 0.008em of descent above 0.868em of
 * ascent, 0.876em; the mean ink-to-ink gap across its two spaces, R|G 0.384em and N|C 0.403em, caps
 * tracking on the space and the letter before it included, is 0.394em; 0.876 + 0.394 = 1.27em.
 * Measured in the browser, the larger of two engines; src/section/hero.browser.test.ts recomputes
 * it from the headline.
 */
export const hero = stylex.defineVars({
  'headline-pitch': '1.27',
});

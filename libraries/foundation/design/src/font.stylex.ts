import * as stylex from '@stylexjs/stylex';

// THE AXIOMS — the typeface and its uses; src/font/archivo.css loads the file they describe.

// The language's one typeface: Archivo, self-hosted under the SIL Open Font License, then its
// metric-matched fallback over the system sans.
const FAMILY = "'Archivo', 'Archivo Fallback', sans-serif";
// The display cut's own fallbacks, matched to its condensed bold capitals: a condensed bold system
// face where one is installed, then Arial Bold.
const DISPLAY_FAMILY =
  "'Archivo', 'Archivo Display Fallback Condensed', 'Archivo Display Fallback Narrow', 'Archivo Display Fallback', sans-serif";
// The body cut's width: Archivo's Normal width, the font's default instance.
const BODY_WIDTH = '100%';
// The body cut's weight: CSS normal, Archivo's Regular.
const BODY_WEIGHT = '400';
// Emphasis: CSS bold, the weight WCAG 1.4.3 counts as bold for large-scale text.
const BOLD_WEIGHT = '700';
// The display cut's width: OpenType and CSS Condensed, where the font's width range ends.
const DISPLAY_WIDTH = '75%';
// The display cut's weight: Bold, where the font's weight range ends.
const DISPLAY_WEIGHT = '700';
// Strings of capitals are letterspaced 5 to 10% of the type size (Bringhurst); the lower bound.
const CAPS_TRACKING = '0.05em';
// Data (scores, tables, times) sets its figures to one width, so columns of them align.
const DATA_NUMERALS = 'tabular-nums';
// The capitals' height as a share of the type size: Archivo's OS/2 cap height, 686 of its 1000
// units, which both cuts hold. Unitless, so it both sizes a mark from the type (× 1em) and the type
// from a cap height (÷).
const CAP_HEIGHT = '0.686';

/**
 * The typeface and its two cuts.
 *
 * Body text sets in the body cut in `family`, bold where it needs emphasis; display text in the
 * display cut in `display-family`, whose fallbacks stand in for that cut until Archivo arrives, in
 * capitals tracked by `caps-tracking`. Mixed case is not tracked. A mark set beside capitals (an
 * arrow, an icon) stands `cap-height` × 1em tall on the baseline, as tall as they are.
 */
export const font = stylex.defineVars({
  family: FAMILY,
  'display-family': DISPLAY_FAMILY,
  'body-width': BODY_WIDTH,
  'body-weight': BODY_WEIGHT,
  'bold-weight': BOLD_WEIGHT,
  'display-width': DISPLAY_WIDTH,
  'display-weight': DISPLAY_WEIGHT,
  'caps-tracking': CAPS_TRACKING,
  'data-numerals': DATA_NUMERALS,
  'cap-height': CAP_HEIGHT,
});

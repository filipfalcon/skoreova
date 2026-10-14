import { font } from '@skoreova/design/font.stylex';
import * as stylex from '@stylexjs/stylex';

/**
 * Archivo's display cut, tracked at the caps tracking for the capitals it sets, with the display
 * cut's fallbacks.
 */
export const displayCut = stylex.create({
  cut: {
    fontFamily: font['display-family'],
    fontStretch: font['display-width'],
    fontWeight: font['display-weight'],
    letterSpacing: font['caps-tracking'],
  },
});

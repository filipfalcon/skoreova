import { focus } from '@skoreova/design/color.stylex';
import * as stylex from '@stylexjs/stylex';

/**
 * The one focus ring every control draws, on keyboard focus only.
 */
export const focusRing = stylex.create({
  ring: {
    outlineStyle: { default: null, ':focus-visible': 'solid' },
    outlineWidth: { default: null, ':focus-visible': focus.width },
    outlineColor: { default: null, ':focus-visible': focus.color },
    outlineOffset: { default: null, ':focus-visible': focus.offset },
  },
});

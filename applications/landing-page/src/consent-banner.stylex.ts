import { chrome, color, focus } from '@skoreova/design/color.stylex';
import { font } from '@skoreova/design/font.stylex';
import { layer } from '@skoreova/design/layer.stylex';
import { duration, easing } from '@skoreova/design/motion.stylex';
import { grid, layout, leading, space, type } from '@skoreova/design/scale.stylex';
import * as stylex from '@stylexjs/stylex';

import { cta } from './cta.stylex';

/**
 * The cookie banner's values, under literal names for the banner's rules in styles.css and its
 * script.
 *
 * The banner is static markup in index.html, bound by the inlined consent script before the app
 * boots and kept working when it fails to, so it carries no StyleX class names; its rules read
 * these custom properties instead, each one a design token or a value composed of tokens. The
 * banner sets on the header's chrome, so it reads as the bar extended; its actions are the small
 * call to action in its filled and outlined variants, from the same tokens as cta.ts.
 */
export const consentBanner = stylex.defineVars({
  '--consent-layer': layer.banner,
  '--consent-fill': chrome.fill,
  '--consent-blur': chrome.blur,
  '--consent-padding-block': space.s,
  '--consent-padding-inline': grid.gutter,
  '--consent-gap': space.s,
  // The card's inset from the viewport's corner from sm, and the distance it rises by as it enters.
  '--consent-inset': grid.gutter,
  '--consent-rise': space.m,
  '--consent-copy-family': font.family,
  '--consent-copy-width': font['body-width'],
  '--consent-copy-weight': font['body-weight'],
  '--consent-copy-size': type['step--2'],
  '--consent-copy-leading': leading['step--2'],
  '--consent-copy-color': color['on-surface-variant'],
  '--consent-tracking': font['caps-tracking'],
  '--consent-accent': color['primary-container'],
  '--consent-on-accent': color['on-primary-container'],
  '--consent-on-surface': color['on-surface'],
  '--consent-surface': color.surface,
  '--consent-outline': color.outline,
  '--consent-hairline': cta['outline-width'],
  '--consent-action-family': font['display-family'],
  '--consent-action-width': font['display-width'],
  '--consent-action-weight': font['display-weight'],
  '--consent-action-size': type['step-0'],
  '--consent-action-leading': leading['step-0'],
  '--consent-action-padding-block': space['2xs'],
  '--consent-action-padding-inline': space.s,
  '--consent-touch-target': layout['touch-target'],
  '--consent-focus-width': focus.width,
  '--consent-focus-color': focus.color,
  '--consent-focus-offset': focus.offset,
  '--consent-state-change': `${duration.short4} ${easing.standard}`,
  '--consent-enter': `${duration.medium4} ${easing['emphasized-decelerate']}`,
  // The breath between the intro's end and the banner's entrance, which the consent script reads.
  '--consent-reveal-delay': duration.long2,
  '--consent-exit': `${duration.short4} ${easing['emphasized-accelerate']}`,
});

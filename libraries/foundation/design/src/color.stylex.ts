import * as stylex from '@stylexjs/stylex';

import { space } from './scale.stylex';

// THE METHOD — Material 3's dynamic color: dark scheme, variant Fidelity, spec 2021, contrast 0.
// The primary source: the brand pink #ff2f8e; the primary palette takes its hue and chroma.
// The neutral source: paper #f3efe8; the neutral palette takes its hue and chroma, and the neutral
// variant palette the same hue at 4 more chroma, Material 3's own rule.
// Each role below is its palette's tone, resolved; src/color.test.ts recomputes every one.

/**
 * The color roles of the dark scheme. There are no secondary or tertiary roles.
 *
 * `on-surface` and `on-surface-variant` read at 4.5:1 or more on the surface and every surface
 * container; `on-primary-container` at 4.5:1 or more on `primary-container`; `outline` at 3:1 or
 * more on the surface (WCAG 1.4.11). `outline-variant` is decorative only.
 */
export const color = stylex.defineVars({
  // Neutral tone 6.
  surface: '#141310',
  // Neutral tone 4.
  'surface-container-lowest': '#0f0e0b',
  // Neutral tone 10.
  'surface-container-low': '#1c1c18',
  // Neutral tone 12.
  'surface-container': '#20201c',
  // Neutral tone 17.
  'surface-container-high': '#2b2a26',
  // Neutral tone 22.
  'surface-container-highest': '#363530',
  // Neutral tone 90.
  'on-surface': '#e6e2db',
  // Neutral variant tone 80.
  'on-surface-variant': '#cac7b7',
  // Neutral variant tone 60.
  outline: '#939183',
  // Neutral variant tone 30.
  'outline-variant': '#48473c',
  // Primary tone 80.
  primary: '#ffb1c7',
  // Primary tone 20.
  'on-primary': '#650032',
  // Primary tone 60, the source's own tone held by Fidelity.
  'primary-container': '#ff4995',
  // Primary tone 13.55, the tone the scheme resolves for contrast with the container.
  'on-primary-container': '#4c0024',
  // Neutral tone 0.
  scrim: '#000000',
});

/**
 * The logo's own colors, fixed, outside the dynamic-color algorithm.
 *
 * A logo is an asset, not interface, so the color roles above do not apply to it, and the rule that
 * pink in the interface means action or now holds without exceptions. The letters take on-surface's
 * value; the period is the brand pink itself, the primary source before Fidelity shifts it. The
 * logo keeps these colors in every state: it does not recolor on hover, and keyboard focus draws
 * the standard focus ring.
 */
export const brand = stylex.defineVars({
  // The on-surface role's value, held fixed.
  'logo-type': '#e6e2db',
  // The brand pink, the primary source.
  'logo-mark': '#ff2f8e',
});

/**
 * The focus ring every control draws: one ring, primary, floated one width clear of the control so
 * it always sits on the page's surface, where primary reads at 10.9:1.
 */
export const focus = stylex.defineVars({
  // The primary role.
  color: '#ffb1c7',
  // WCAG 2.4.13's minimum, a 2px perimeter.
  width: '2px',
  // Equal to the width.
  offset: '2px',
});

/**
 * The translucent bar over scrolling content.
 *
 * Over any content the bar stays a surface of the palette: its fill is the surface at the lowest
 * alpha at which, composited in sRGB over pure white, its tone (CIELAB L*) does not exceed tone 22
 * of `surface-container-highest`, the lightest surface role. That is 0.8575, rounded up. Every text
 * color the bar sets (on-surface, on-surface-variant, primary) then keeps 4.5:1 over white beneath
 * it. The blur is one body line, so text scrolling beneath is never legible. A rule in
 * `outline-variant` ends the bar.
 */
export const chrome = stylex.defineVars({
  fill: 'rgba(20, 19, 16, 0.858)',
  blur: `blur(${space.m})`,
  'rule-color': '#48473c',
  'rule-width': '1px',
});

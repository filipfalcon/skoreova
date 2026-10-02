import * as stylex from '@stylexjs/stylex';

// THE SOURCE — Material 3's baseline motion tokens, verbatim (m3.material.io, Motion: easing and
// duration, tokens and specs).

/**
 * Material 3's durations: short, medium and long in 50ms steps, extra long in 100ms steps.
 *
 * A state change (hover, color) runs `short4` on the standard easing; an element entering runs
 * `medium4` on emphasized decelerate; an element leaving runs `short4` on emphasized accelerate.
 *
 * Under `prefers-reduced-motion` transforms are dropped, while color and opacity transitions stay:
 * WCAG 2.3.3 asks only that motion from interaction can be turned off.
 */
export const duration = stylex.defineVars({
  short1: '50ms',
  short2: '100ms',
  short3: '150ms',
  short4: '200ms',
  medium1: '250ms',
  medium2: '300ms',
  medium3: '350ms',
  medium4: '400ms',
  long1: '450ms',
  long2: '500ms',
  long3: '550ms',
  long4: '600ms',
  'extra-long1': '700ms',
  'extra-long2': '800ms',
  'extra-long3': '900ms',
  'extra-long4': '1000ms',
});

/**
 * Material 3's easing curves.
 */
export const easing = stylex.defineVars({
  // For most motion: begins quickly, ends slowly.
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  // An element entering on the standard curve.
  'standard-decelerate': 'cubic-bezier(0, 0, 0, 1)',
  // An element leaving on the standard curve.
  'standard-accelerate': 'cubic-bezier(0.3, 0, 1, 1)',
  // An element entering, with emphasis.
  'emphasized-decelerate': 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  // An element leaving, with emphasis.
  'emphasized-accelerate': 'cubic-bezier(0.3, 0, 0.8, 0.15)',
  // Material 2's standard curve, kept for continuity.
  legacy: 'cubic-bezier(0.4, 0, 0.2, 1)',
  // Constant speed, for color and opacity fades that should not ease.
  linear: 'cubic-bezier(0, 0, 1, 1)',
});

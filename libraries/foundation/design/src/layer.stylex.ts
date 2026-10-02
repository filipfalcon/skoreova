import * as stylex from '@stylexjs/stylex';

/**
 * The stacking order of the page's layers, bottom to top, in consecutive ordinals.
 *
 * Each layer covers the ones below it. Content stacks its own children in a context of its own, so
 * no z-index inside it reaches the layers above.
 */
export const layer = stylex.defineVars({
  // The page's flow: sections and the footer.
  content: '0',
  // The cookie notice: over content, and under the menu, which covers it while open.
  banner: '1',
  // The menu, sliding out beneath the bar.
  overlay: '2',
  // The translucent bar, over everything it scrolls over.
  chrome: '3',
  // The skip link, shown over the bar it sits in the moment it takes focus.
  'skip-link': '4',
});

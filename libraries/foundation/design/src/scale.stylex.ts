import * as stylex from '@stylexjs/stylex';

// THE AXIOMS — the only hand-chosen numbers; every token is derived from them.

// The narrowest viewport fluid values interpolate from: WCAG 1.4.10 Reflow's 320 CSS px.
const MIN_VIEWPORT_PX = 320;
// The widest viewport fluid values interpolate to: 4 × 320.
const MAX_VIEWPORT_PX = 1280;
// Step 0 at the narrowest viewport: the browser default and Material 3's Body Large.
const MIN_STEP_0_PX = 16;
// Step 0 at the widest viewport: Utopia's default; 20 ÷ 5/4 = 16, so phone body text is desktop step −1.
const MAX_STEP_0_PX = 20;
// The type ratio at the narrowest viewport: Utopia's default minor third.
const MIN_RATIO = 6 / 5;
// The type ratio at the widest viewport: Utopia's default major third.
const MAX_RATIO = 5 / 4;
// Body text's line height: WCAG 1.4.8, and Material 3's Body Large at 16/24.
const BODY_LINE_HEIGHT = 1.5;
// The measure of running text: Bringhurst's ideal, within WCAG 1.4.8's 80-character limit.
const MEASURE = '66ch';
// The header's height in rem, fixed: Material 3's top app bar at 64dp.
const HEADER_HEIGHT_REM = 4;
// The smallest touch target in rem, fixed: Material 3's 48dp, above WCAG 2.5.5's 44px.
const TOUCH_TARGET_REM = 3;
// An icon's box in rem, fixed: Material 3's 24dp icon; Utopia and WCAG define none.
const ICON_REM = 1.5;

// THE MATH — Utopia's fluid interpolation, written in rem + vw so browser zoom scales it.

const PX_PER_REM = 16;

const round = (value: number): number => Math.round(value * 10000) / 10000;

const rem = (px: number): string => `${round(px / PX_PER_REM)}rem`;

const slope = (minPx: number, maxPx: number): number =>
  (maxPx - minPx) / (MAX_VIEWPORT_PX - MIN_VIEWPORT_PX);

const intercept = (minPx: number, maxPx: number): number =>
  minPx - slope(minPx, maxPx) * MIN_VIEWPORT_PX;

// A length that is `minPx` up to the narrowest viewport, `maxPx` from the widest, and linear between.
const fluid = (minPx: number, maxPx: number): string =>
  `clamp(${rem(minPx)}, ${rem(intercept(minPx, maxPx))} + ${round(slope(minPx, maxPx) * 100)}vw, ${rem(maxPx)})`;

const minStep = (n: number): number => MIN_STEP_0_PX * MIN_RATIO ** n;

const maxStep = (n: number): number => MAX_STEP_0_PX * MAX_RATIO ** n;

const step = (n: number): string => fluid(minStep(n), maxStep(n));

// The space a line adds to its type: the share of step 0 that the body line height adds, which is
// space `2xs`.
const minLineGap = MIN_STEP_0_PX * (BODY_LINE_HEIGHT - 1);
const maxLineGap = MAX_STEP_0_PX * (BODY_LINE_HEIGHT - 1);

const lineHeight = (n: number): string => fluid(minStep(n) + minLineGap, maxStep(n) + maxLineGap);

// A space is step 0 times its multiplier, at each end.
const single = (multiplier: number): string =>
  fluid(MIN_STEP_0_PX * multiplier, MAX_STEP_0_PX * multiplier);

// A pair runs from the smaller space's narrowest value to the larger space's widest.
const pair = (from: number, to: number): string => fluid(MIN_STEP_0_PX * from, MAX_STEP_0_PX * to);

// Utopia's space multipliers of step 0.
const SPACE_3XS = 0.25;
const SPACE_2XS = 0.5;
const SPACE_XS = 0.75;
const SPACE_S = 1;
const SPACE_M = 1.5;
const SPACE_L = 2;
const SPACE_XL = 3;
const SPACE_2XL = 4;
const SPACE_3XL = 6;

/**
 * The type scale: Utopia's steps −2 to +5, step 0 being body text.
 *
 * At the narrowest viewport step n is step 0 times the narrow ratio to the nth power, at the widest
 * step 0 times the wide ratio to the nth; between them each step interpolates linearly between its
 * own two end values, Utopia's method, rather than raising an interpolated ratio.
 */
export const type = stylex.defineVars({
  'step--2': step(-2),
  'step--1': step(-1),
  'step-0': step(0),
  'step-1': step(1),
  'step-2': step(2),
  'step-3': step(3),
  'step-4': step(4),
  'step-5': step(5),
});

/**
 * The line height of each type step: the step plus space `2xs`. Step 0 sets at exactly 1.5 at every
 * width, WCAG 1.4.8's spacing for body text.
 *
 * The rule is this scale's own. It resembles Material 3's display and headline styles, which set
 * their line height at the size plus 7 to 8dp; Material 3's smaller styles add 4 to 6dp.
 *
 * Each step has its own length, set beside its size. A single `calc(1em + …)` would not do: a
 * length line height inherits as its computed px value, so a child at another step would take its
 * parent's.
 */
export const leading = stylex.defineVars({
  'step--2': lineHeight(-2),
  'step--1': lineHeight(-1),
  'step-0': lineHeight(0),
  'step-1': lineHeight(1),
  'step-2': lineHeight(2),
  'step-3': lineHeight(3),
  'step-4': lineHeight(4),
  'step-5': lineHeight(5),
});

/**
 * The space scale: Utopia's single steps of step 0, its one-up pairs, and the custom pair `s-l`.
 */
export const space = stylex.defineVars({
  '3xs': single(SPACE_3XS),
  '2xs': single(SPACE_2XS),
  xs: single(SPACE_XS),
  s: single(SPACE_S),
  m: single(SPACE_M),
  l: single(SPACE_L),
  xl: single(SPACE_XL),
  '2xl': single(SPACE_2XL),
  '3xl': single(SPACE_3XL),
  '3xs-2xs': pair(SPACE_3XS, SPACE_2XS),
  '2xs-xs': pair(SPACE_2XS, SPACE_XS),
  'xs-s': pair(SPACE_XS, SPACE_S),
  's-m': pair(SPACE_S, SPACE_M),
  'm-l': pair(SPACE_M, SPACE_L),
  'l-xl': pair(SPACE_L, SPACE_XL),
  'xl-2xl': pair(SPACE_XL, SPACE_2XL),
  '2xl-3xl': pair(SPACE_2XL, SPACE_3XL),
  's-l': pair(SPACE_S, SPACE_L),
});

/**
 * The layout grid: Utopia's defaults, twelve columns at every width.
 *
 * The page's side gutter and the gap between columns are both the `s-l` space pair. The container's
 * maximum width includes the gutters and equals the widest viewport, so content at the top is the
 * maximum width less two gutters.
 *
 * On narrow screens blocks span multiples of three columns, twelve being four groups of three:
 * Material 3's four-column compact grid. Tables do not use the page grid.
 */
export const grid = stylex.defineVars({
  columns: '12',
  gutter: pair(SPACE_S, SPACE_L),
  gap: pair(SPACE_S, SPACE_L),
  'max-width': rem(MAX_VIEWPORT_PX),
});

/**
 * The fixed layout measures: the measure of running text, the header's height, the smallest touch
 * target, an icon's box, and the header's block padding.
 *
 * The header's block padding centres a touch target in the header's height, half the difference of
 * the two: fixed, since both are.
 */
export const layout = stylex.defineVars({
  measure: MEASURE,
  'header-height': `${HEADER_HEIGHT_REM}rem`,
  'touch-target': `${TOUCH_TARGET_REM}rem`,
  icon: `${ICON_REM}rem`,
  'header-padding-block': `${(HEADER_HEIGHT_REM - TOUCH_TARGET_REM) / 2}rem`,
});

/**
 * The rows of a data table.
 *
 * A row's block padding is space `xs`, so a row of step 0 text, its line height plus two `xs`,
 * equals space `xl` exactly: three times step 0, 48px at the narrowest viewport and 60px at the
 * widest. The row grows with its content, its height set by padding and never fixed.
 */
export const tableRow = stylex.defineVars({
  'padding-block': single(SPACE_XS),
});

import { font } from '@skoreova/design/font.stylex';
import { duration, easing } from '@skoreova/design/motion.stylex';
import * as stylex from '@stylexjs/stylex';
import { inertHtml as ih } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import { type StyleXStyle, getStyleXAttributesWith } from './stylexAttributes';

// Space 3xs's share of step 0, a quarter, applied to the text's own size: the gap before an arrow
// that follows text, and the distance a platform arrow nudges.
const THREE_XS_SHARE = '0.25em';
const NUDGED = `translateX(${THREE_XS_SHARE})`;

const HOVER = '@media (hover: hover)';
const REDUCED_MOTION = '@media (prefers-reduced-motion: reduce)';
// Conditions for the push, which never applies under reduced motion: an override there would lose
// to the hover rule's more specific selector.
const MOTION_ALLOWED = '@media (prefers-reduced-motion: no-preference)';
const HOVER_WITH_MOTION = '@media (hover: hover) and (prefers-reduced-motion: no-preference)';

// WCAG 2.2.2 Pause, Stop, Hide (level A): motion that starts on its own ends within 5 seconds of
// its trigger.
const MOTION_LIMIT_MS = 5000;

/**
 * One leg of the knock, out or back: a state change, Material 3's short4, in milliseconds.
 */
export const KNOCK_LEG_MS = 200;

/**
 * One knock, in milliseconds: out, back, out, back, four legs of short4, then a rest as long, so
 * repeated knocks read as knocks rather than a shiver. 8 × 200ms = 1600ms.
 */
export const KNOCK_MS = 8 * KNOCK_LEG_MS;

/**
 * The longest wait from a trigger to the first knock, in milliseconds. An arrow knocks once its CTA
 * has arrived: the header's 400ms after it is shown (its entrance, Material 3's medium4), the
 * hero's as it lands, and the menu's once its Platform entry, the last of the menu's falling
 * entries, lands (8 − 1) × 80ms + 280ms = 840ms after the menu opens (the cascade in styles.css).
 */
export const LONGEST_WAIT_MS = 840;

/**
 * The knocks each trigger plays: as many whole knocks as fit after the longest wait within WCAG
 * 2.2.2's 5 seconds. ⌊(5000 − 840) / 1600⌋ = ⌊2.6⌋ = 2, the menu's ending 840 + 2 × 1600 = 4040ms
 * after it opens. The hero's end within 5 seconds of the page's load too: its CTA lands at 650ms +
 * 700ms, and 1350 + 3200 = 4550ms.
 */
export const KNOCKS = Math.floor((MOTION_LIMIT_MS - LONGEST_WAIT_MS) / KNOCK_MS);

// Out and back twice in the first half, at rest through the second; each leg eases on the
// standard curve, a state change.
const knock = stylex.keyframes({
  '0%': { transform: 'none' },
  '12.5%': { transform: NUDGED },
  '25%': { transform: 'none' },
  '37.5%': { transform: NUDGED },
  '50%': { transform: 'none' },
  '100%': { transform: 'none' },
});

// The knock's run, from its delay; none under reduced motion, or while the pointer holds the push.
const knockRun = (delay: string) => ({
  animationName: {
    default: knock,
    [stylex.when.ancestor(':hover')]: { default: null, [HOVER]: 'none' },
    [stylex.when.ancestor(':active')]: 'none',
    [REDUCED_MOTION]: 'none',
  },
  animationDuration: `calc(8 * ${duration.short4})`,
  animationTimingFunction: easing.standard,
  animationIterationCount: KNOCKS,
  animationDelay: delay,
});

/**
 * The drawn arrow beside display type, and the platform CTAs' knock.
 *
 * A platform CTA marks its anchor with `stylex.defaultMarker()`: its arrow pushes out while the
 * anchor is hovered or pressed.
 */
export const styles = stylex.create({
  // As tall as the capitals beside it, standing on their baseline.
  arrow: {
    display: 'inline-block',
    height: font['cap-height'],
    width: 'auto',
    verticalAlign: 'baseline',
  },
  // After text, a 3xs share of its size apart.
  follows: {
    marginLeft: THREE_XS_SHARE,
  },
  // Pushed out, held, while the pointer is on the CTA, eased as a state change; never under reduced
  // motion.
  platform: {
    transform: {
      default: null,
      [stylex.when.ancestor(':hover')]: { default: null, [HOVER_WITH_MOTION]: NUDGED },
      [stylex.when.ancestor(':active')]: { default: null, [MOTION_ALLOWED]: NUDGED },
    },
    transition: {
      default: `transform ${duration.short4} ${easing.standard}`,
      [REDUCED_MOTION]: 'none',
    },
  },
  // Knocks once the header's CTA, shown, has entered.
  knockOnHeaderEntry: knockRun(duration.medium4),
  // Knocks once the hero's CTA has landed: its fade's delay and duration, which the hero sets on
  // the fade's element.
  knockOnHeroLanding: knockRun('calc(var(--hero-delay) + var(--hero-fade-duration))'),
  // Knocks once the menu's Platform entry, the first of its entries and the last to fall, has
  // landed: the cascade's delay steps for the entries below it, then its fall.
  knockOnMenuLanding: knockRun(
    'calc((var(--menu-count) - 1) * var(--menu-fall-step) + var(--menu-fall-base))',
  ),
});

// A chunky inline arrow for display-type CTAs. The text glyph "→" renders
// hairline-thin beside the display cut and sits on the baseline instead of
// the cap center. One filled silhouette rather than strokes — square line
// caps left a nub poking past the head’s point. Its box stands on the
// baseline as tall as the capitals (styles.arrow), so the shaft lands on
// the optical center of the uppercase line.
const drawnRightArrow = (hook: string, ...variants: ReadonlyArray<StyleXStyle>): Html =>
  ih.svg(
    [
      ih.Xmlns('http://www.w3.org/2000/svg'),
      ih.ViewBox('0 0 32 24'),
      ...getStyleXAttributesWith(ih, hook, styles.arrow, ...variants),
      ih.Fill('currentColor'),
      ih.AriaHidden(true),
    ],
    [ih.path([ih.D('M0 9.6 H18 V3 L31 12 L18 21 V14.4 H0 Z')])],
  );

// `drawn-arrow` is the sitewide hover contract: any drawn arrow inside a
// hovered link or button nudges right (styles.css). It follows text…
export const displayArrow: Html = drawnRightArrow('drawn-arrow', styles.follows);
// …or stands alone (the row-affordance chips) — no gap to carry.
export const displayArrowSolo: Html = drawnRightArrow('drawn-arrow');

/**
 * The arrow of a platform CTA, which owns its hover instead of the sitewide contract: it knocks
 * once its trigger fires, and pushes out while the CTA, marked with `stylex.defaultMarker()`, is
 * hovered or pressed.
 *
 * @param knock The knock to play, or `false` while its trigger has not fired.
 */
export const platformArrow = (knock: StyleXStyle): Html =>
  drawnRightArrow('', styles.follows, styles.platform, knock);

// The EXTERNAL-link mark (↗), for destinations outside our world (uefa.com,
// social profiles) — the drawn right arrow stays reserved for our own
// navigation. Deliberately NOT the display arrow’s filled silhouette: this
// mark only ever sits next to small body type (10–14px), so it’s a line
// drawing in the text glyph’s register — a diagonal shaft and a simple
// corner roof, stroked at the text’s own weight (3.5 in-box ≈ 1–1.3px at
// those sizes). Butt caps, like the menu glyph — hard edges everywhere.
// `drawn-arrow-external`: the hover contract nudges it along its own
// diagonal (styles.css).
export const drawnExternalArrow = (classes: string): Html =>
  ih.svg(
    [
      ih.Xmlns('http://www.w3.org/2000/svg'),
      ih.ViewBox('0 0 24 24'),
      ih.Class(`drawn-arrow drawn-arrow-external ${classes}`),
      ih.Fill('none'),
      ih.Stroke('currentColor'),
      // 3.1, not the computed 3.5 — a diagonal reads optically heavier than
      // an upright stroke of the same width (checked against the type at 4×).
      ih.StrokeWidth('3.1'),
      ih.AriaHidden(true),
    ],
    [ih.path([ih.D('M2.5 21.5 L21.5 2.5 M10 2.5 H21.5 V14')])],
  );
// 0.72em — next to the small body type of receipts and handles the shaft
// then matches the text’s own stroke weight, which is exactly the quiet
// register these micro-links want.
export const displayArrowExternal: Html = drawnExternalArrow(
  'ml-[0.22em] inline-block h-[0.72em] w-auto',
);

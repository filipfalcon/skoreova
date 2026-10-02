import { chrome, color, focus } from '@skoreova/design/color.stylex';
import { font } from '@skoreova/design/font.stylex';
import { layer } from '@skoreova/design/layer.stylex';
import { duration, easing } from '@skoreova/design/motion.stylex';
import { grid, layout, leading, space, type } from '@skoreova/design/scale.stylex';
import * as stylex from '@stylexjs/stylex';

/**
 * The row content width, in rem, below which the stage label gives way to a showing CTA.
 *
 * Each give-way width is where the row's token sum meets the row's content width, at the default
 * text size, with Archivo's advances (caps tracking included) measured from the font. The sum is
 * wordmark (5.158em of step 2, display cut) + gap xs + label + gap 2xs + CTA + gap xs + menu (touch
 * target); the label is 2.725em of step −2 (body cut) + 2 × 2xs + 2px of border; the short CTA is
 * 5.965em of step 0 (display cut, arrow included) + 2 × s, the long one 3.173em of step 0 more.
 * With the label the sum meets the row at 442.9px (a 483px viewport), so the label gives way below
 * 444px — while there is a CTA beside it. Without one the row asks wordmark + gap xs + label + gap
 * 2xs + menu: 235.1px of the 288px row at 320, so the label fits in every other state.
 */
export const LABEL_GIVES_WAY_REM = 27.75;

/**
 * The row content width, in rem, below which the CTA's first word gives way.
 *
 * Without the label the long CTA meets the row at 373.7px (a 410px viewport), so the first word
 * gives way below 376px.
 */
export const LEAD_GIVES_WAY_REM = 23.5;

/**
 * The row content width, in rem, below which the CTA's arrow gives way, leaving "Platform".
 *
 * The short CTA meets the row at 316.8px (a 350px viewport), so the arrow (1.165em of step 0) gives
 * way below 320px. Without it the row still asks 295.7px of the 288px row at 320, 7.7px over.
 */
export const ARROW_GIVES_WAY_REM = 20;

/**
 * The row content width, in rem, below which the CTA gives way entirely, hidden as it is on the
 * hero.
 *
 * Without its arrow the CTA meets the row at 296.3px (a 329px viewport), so it gives way below
 * 300px: only viewports from 320 to 328px, narrower than any common phone. The menu carries the
 * same platform link. With the CTA gone the row asks 174.8px (wordmark + gap 2xs + menu) of the
 * 288px row at 320, 113.2px spare.
 */
export const CTA_GIVES_WAY_REM = 18.75;

/**
 * The menu glyph's drawing, in its own units: three bars of `MENU_GLYPH_BAR` across a box of
 * `MENU_GLYPH_WIDTH` × `MENU_GLYPH_HEIGHT`, the outer two inked flush with its top and bottom
 * edges.
 */
export const MENU_GLYPH_WIDTH = 24;
export const MENU_GLYPH_HEIGHT = 20;
export const MENU_GLYPH_BAR = 3.43;

/**
 * The bars' rows: the outer two half a bar in from the edges, so their ink fills the box, and the
 * middle one at its centre. 1.715, 10 and 18.285.
 */
export const MENU_GLYPH_TOP_ROW = MENU_GLYPH_BAR / 2;
export const MENU_GLYPH_MIDDLE_ROW = MENU_GLYPH_HEIGHT / 2;
export const MENU_GLYPH_BOTTOM_ROW = MENU_GLYPH_HEIGHT - MENU_GLYPH_BAR / 2;

/**
 * The angle, in degrees, the outer bars swing to as the glyph turns into an X.
 *
 * Each bar turns about its own centre, moved to the box's centre, so the X keeps the box's height:
 * a bar of length L and thickness t at angle θ inks a height of L sin θ + t cos θ (its butt caps
 * reach past the ends of its centre line by t/2 cos θ each), and that height equals the box's H. So
 * θ = asin(H / √(L² + t²)) − atan(t / L) = asin(20 / 24.2439) − atan(3.43 / 24) = 55.583° − 8.134°
 * = 47.45°, rounded to the hundredth.
 */
export const MENU_GLYPH_ANGLE_DEG = 47.45;

// The label's room runs out only between the CTA's own give-way width and its own: below the CTA's
// the CTA is gone and the label fits again, 52.9px to spare at 320.
const NO_ROOM_FOR_LABEL = `@container (${CTA_GIVES_WAY_REM}rem < width <= ${LABEL_GIVES_WAY_REM}rem)`;
const NO_ROOM_FOR_LEAD = `@container (max-width: ${LEAD_GIVES_WAY_REM}rem)`;
const NO_ROOM_FOR_ARROW = `@container (max-width: ${ARROW_GIVES_WAY_REM}rem)`;
const NO_ROOM_FOR_CTA = `@container (max-width: ${CTA_GIVES_WAY_REM}rem)`;

// Archivo's display cut, in capitals tracked at the caps tracking.
const DISPLAY_CUT = {
  fontFamily: font.family,
  fontStretch: font['display-width'],
  fontWeight: font['display-weight'],
  letterSpacing: font['caps-tracking'],
} as const;

// Archivo's body cut.
const BODY_CUT = {
  fontFamily: font.family,
  fontStretch: font['body-width'],
  fontWeight: font['body-weight'],
} as const;

const HOVER = '@media (hover: hover)';
const REDUCED_MOTION = '@media (prefers-reduced-motion: reduce)';

const HIT = layout['touch-target'];

// A state change: Material 3's short4 on the standard easing.
const STATE_CHANGE = `${duration.short4} ${easing.standard}`;
// An element entering: medium4 on emphasized decelerate.
const ENTERING = `${duration.medium4} ${easing['emphasized-decelerate']}`;
// An element leaving: short4 on emphasized accelerate.
const LEAVING = `${duration.short4} ${easing['emphasized-accelerate']}`;

// The page grid's gutter, plus the safe-area inset so a phone held landscape keeps the row clear
// of the notch.
const gutter = (side: 'left' | 'right'): string =>
  `calc(${grid.gutter} + env(safe-area-inset-${side}))`;

// The one focus ring every control draws.
const FOCUS_RING = {
  outlineStyle: { default: null, ':focus-visible': 'solid' },
  outlineWidth: { default: null, ':focus-visible': focus.width },
  outlineColor: { default: null, ':focus-visible': focus.color },
  outlineOffset: { default: null, ':focus-visible': focus.offset },
} as const;

// The CTA's fade and colors, which stay under reduced motion: the fade on the given motion, the
// colors as a state change, and the visibility leg delayed by `visibilityDelay`.
const ctaStill = (motion: string, visibilityDelay: string): string =>
  `opacity ${motion}, background-color ${STATE_CHANGE}, color ${STATE_CHANGE}, visibility 0s ${easing.linear} ${visibilityDelay}`;

// The CTA's transitions: its slide on the same motion as the fade, dropped under reduced motion.
const ctaTransition = (motion: string, visibilityDelay: string) => ({
  default: `transform ${motion}, ${ctaStill(motion, visibilityDelay)}`,
  [REDUCED_MOTION]: ctaStill(motion, visibilityDelay),
});

// The outer bars' slide to the middle row: 10 − 1.715 = 8.285.
const GLYPH_SLIDE = MENU_GLYPH_MIDDLE_ROW - MENU_GLYPH_TOP_ROW;

// The glyph's bars turn between the hamburger and the X: entering as the menu opens, leaving as it
// closes. The middle bar's fade is a state change either way, and stays under reduced motion while
// the bars snap.
const glyphTransition = (motion: string) => ({
  default: `transform ${motion}, opacity ${STATE_CHANGE}`,
  [REDUCED_MOTION]: `opacity ${STATE_CHANGE}`,
});

// The menu slides on the glyph's motion, so the two are one gesture, and is hidden once it has
// left; it snaps under reduced motion.
const menuSlide = (motion: string, visibilityDelay: string) => ({
  default: `transform ${motion}, visibility 0s ${easing.linear} ${visibilityDelay}`,
  [REDUCED_MOTION]: 'none',
});

/**
 * The landing page's header bar.
 */
export const styles = stylex.create({
  // The translucent chrome over a blur of the page under it, on the chrome layer, over the menu
  // overlay that slides out from beneath it. The bar's box is the header height, the rule drawn
  // under it, so a touch target centred in it leaves header-padding-block above and below.
  bar: {
    position: 'fixed',
    insetInline: 0,
    top: 0,
    zIndex: layer.chrome,
    boxSizing: 'content-box',
    height: layout['header-height'],
    // The rule ends the blur in a hard edge: without it the bar's frosted ground and dark content
    // scrolling under it meet in a smear with no line between them.
    borderBottomWidth: chrome['rule-width'],
    borderBottomStyle: 'solid',
    borderBottomColor: chrome['rule-color'],
    backgroundColor: chrome.fill,
    backdropFilter: chrome.blur,
    WebkitBackdropFilter: chrome.blur,
    color: color['on-surface'],
  },
  // The container the give-way rules ask: its content width is the room the row's items share.
  row: {
    position: 'relative',
    containerType: 'inline-size',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: space['2xs'],
    height: '100%',
    maxWidth: grid['max-width'],
    marginInline: 'auto',
    paddingLeft: gutter('left'),
    paddingRight: gutter('right'),
  },
  // Out of sight until it takes focus, then a block over the wordmark, on the skip-link layer.
  skipLink: {
    position: 'absolute',
    zIndex: layer['skip-link'],
    // Half a touch target above the row's middle.
    top: `calc(50% - ${HIT} / 2)`,
    left: gutter('left'),
    // The visually-hidden pattern's one-pixel box until focus.
    width: { default: '1px', ':focus': 'auto' },
    height: { default: '1px', ':focus': HIT },
    overflow: { default: 'hidden', ':focus': 'visible' },
    clipPath: { default: 'inset(50%)', ':focus': 'none' },
    display: 'flex',
    alignItems: 'center',
    paddingInline: { default: 0, ':focus': space.s },
    whiteSpace: 'nowrap',
    backgroundColor: color['on-surface'],
    color: color.surface,
    ...BODY_CUT,
    fontSize: type['step-0'],
    lineHeight: leading['step-0'],
    textDecoration: 'none',
    ...FOCUS_RING,
  },
  identity: {
    display: 'flex',
    alignItems: 'center',
    columnGap: space.xs,
    minWidth: 0,
  },
  wordmark: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: HIT,
    ...DISPLAY_CUT,
    fontSize: type['step-2'],
    lineHeight: leading['step-2'],
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    color: {
      default: color['on-surface'],
      ':focus-visible': color.primary,
      ':hover': { default: null, [HOVER]: color.primary },
    },
    transition: `color ${STATE_CHANGE}`,
    ...FOCUS_RING,
  },
  period: {
    color: color['primary-container'],
  },
  // A status, not a control: a sibling of the wordmark link, so it takes neither its hit area nor
  // its hover.
  stage: {
    display: 'inline-block',
    flexShrink: 0,
    // A hairline.
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: color['on-surface-variant'],
    // The tracking trails the last letter too, so the right padding gives it back to keep the word
    // optically centred in its box.
    paddingBlock: space['3xs'],
    paddingLeft: space['2xs'],
    paddingRight: `calc(${space['2xs']} - ${font['caps-tracking']})`,
    ...BODY_CUT,
    fontSize: type['step--2'],
    lineHeight: leading['step--2'],
    letterSpacing: font['caps-tracking'],
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    color: color['on-surface-variant'],
    userSelect: 'none',
  },
  // Beside a showing CTA, the label gives way first, and comes back once the CTA itself has given
  // way; with the CTA hidden it always fits.
  stageBesideCta: {
    display: { default: 'inline-block', [NO_ROOM_FOR_LABEL]: 'none' },
  },
  actions: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    columnGap: space.xs,
    flexShrink: 0,
  },
  // Its box is step 0's line plus 2xs above and below: 40px at the narrowest viewport, 50px at the
  // widest.
  cta: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    paddingBlock: space['2xs'],
    paddingInline: space.s,
    ...DISPLAY_CUT,
    fontSize: type['step-0'],
    lineHeight: leading['step-0'],
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    color: color['on-primary-container'],
    backgroundColor: {
      default: color['primary-container'],
      ':active': color['on-surface'],
      ':hover': { default: null, [HOVER]: color['on-surface'] },
    },
    ...FOCUS_RING,
    // Where the box is shorter than a touch target, its pointer target reaches out to one,
    // centred; where it is taller, the box itself is the target.
    '::before': {
      content: '""',
      position: 'absolute',
      top: `min(0px, calc(50% - ${HIT} / 2))`,
      bottom: `min(0px, calc(50% - ${HIT} / 2))`,
      insetInline: 0,
    },
  },
  // Hidden while the hero, with its own CTA, is on screen. A real `visibility: hidden`, so the link
  // leaves the tab order and the accessibility tree rather than lurking invisibly in both. It also
  // leaves the row's flow, centred where it shows, one actions gap from the menu button, so the
  // hidden link takes no room from the wordmark and its label.
  ctaHidden: {
    position: 'absolute',
    insetBlock: 0,
    right: `calc(100% + ${space.xs})`,
    height: 'fit-content',
    marginBlock: 'auto',
    opacity: 0,
    visibility: 'hidden',
    pointerEvents: 'none',
    // Lifted by space 2xs, from which it settles in; dropped under reduced motion.
    transform: {
      default: `translateY(calc(-1 * ${space['2xs']}))`,
      [REDUCED_MOTION]: 'none',
    },
    // Leaving: Material 3's short4 on emphasized accelerate, hidden once it has faded.
    transition: ctaTransition(LEAVING, duration.short4),
  },
  // Entering: Material 3's medium4 on emphasized decelerate, visible at once. Where the row has no
  // room for it even bare, it takes its hidden state's place: invisible, out of the tab order and
  // out of the row's flow.
  ctaShown: {
    opacity: { default: 1, [NO_ROOM_FOR_CTA]: 0 },
    visibility: { default: 'visible', [NO_ROOM_FOR_CTA]: 'hidden' },
    pointerEvents: { default: 'auto', [NO_ROOM_FOR_CTA]: 'none' },
    position: { default: 'relative', [NO_ROOM_FOR_CTA]: 'absolute' },
    insetBlock: { default: 'auto', [NO_ROOM_FOR_CTA]: 0 },
    right: { default: 'auto', [NO_ROOM_FOR_CTA]: `calc(100% + ${space.xs})` },
    height: { default: 'auto', [NO_ROOM_FOR_CTA]: 'fit-content' },
    marginBlock: { default: 0, [NO_ROOM_FOR_CTA]: 'auto' },
    transform: 'none',
    transition: ctaTransition(ENTERING, '0s'),
  },
  // The first word gives way after the label.
  ctaLead: {
    display: { default: 'inline', [NO_ROOM_FOR_LEAD]: 'none' },
    whiteSpace: 'pre',
  },
  // The arrow gives way last, leaving "Platform". A block, as the CTA's other items are made, of
  // one line of its type, so the arrow stands on the baseline the words do.
  ctaArrow: {
    display: { default: 'block', [NO_ROOM_FOR_ARROW]: 'none' },
  },
  menuButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: HIT,
    height: HIT,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: {
      default: color['on-surface'],
      ':focus-visible': color.primary,
      ':hover': { default: null, [HOVER]: color.primary },
    },
    transition: `color ${STATE_CHANGE}`,
    ...FOCUS_RING,
  },
  // An icon's box, centred in the touch target; the glyph's own 24 × 20 drawing sits centred in it.
  menuGlyph: {
    width: layout.icon,
    height: layout.icon,
  },
  // Every bar turns about a point of the glyph's own drawing.
  menuGlyphBar: {
    transformBox: 'view-box',
  },
  // About their own centres.
  menuGlyphTop: {
    transformOrigin: `${MENU_GLYPH_WIDTH / 2}px ${MENU_GLYPH_TOP_ROW}px`,
  },
  menuGlyphBottom: {
    transformOrigin: `${MENU_GLYPH_WIDTH / 2}px ${MENU_GLYPH_BOTTOM_ROW}px`,
  },
  menuGlyphOpening: {
    transition: glyphTransition(ENTERING),
  },
  menuGlyphClosing: {
    transition: glyphTransition(LEAVING),
  },
  // Open, the outer bars slide to the middle row and swing onto the X's diagonals, and the middle
  // bar fades away.
  menuGlyphTopOpen: {
    transform: `translateY(${GLYPH_SLIDE}px) rotate(${MENU_GLYPH_ANGLE_DEG}deg)`,
  },
  menuGlyphMiddleOpen: {
    opacity: 0,
  },
  menuGlyphBottomOpen: {
    transform: `translateY(${-GLYPH_SLIDE}px) rotate(${-MENU_GLYPH_ANGLE_DEG}deg)`,
  },
  // The menu, on the overlay layer, beneath the bar it slides out from.
  menuOverlay: {
    zIndex: layer.overlay,
  },
  menuOverlayOpening: {
    transition: menuSlide(ENTERING, '0s'),
  },
  menuOverlayClosing: {
    transition: menuSlide(LEAVING, duration.short4),
  },
});

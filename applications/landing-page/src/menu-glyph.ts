import { layout } from '@skoreova/design/scale.stylex';
import { duration, easing } from '@skoreova/design/motion.stylex';
import * as stylex from '@stylexjs/stylex';
import type { Html, HtmlBuilder } from 'foldkit/html';

import type { Message } from './message';
import { type StyleXStyle, getStyleXAttributes } from './stylex-attributes';

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

const REDUCED_MOTION = '@media (prefers-reduced-motion: reduce)';

// A state change: Material 3's short4 on the standard easing.
const STATE_CHANGE = `${duration.short4} ${easing.standard}`;
// An element entering: medium4 on emphasized decelerate.
const ENTERING = `${duration.medium4} ${easing['emphasized-decelerate']}`;
// An element leaving: short4 on emphasized accelerate.
const LEAVING = `${duration.short4} ${easing['emphasized-accelerate']}`;

// The outer bars' slide to the middle row: 10 − 1.715 = 8.285.
const GLYPH_SLIDE = MENU_GLYPH_MIDDLE_ROW - MENU_GLYPH_TOP_ROW;

// The glyph's bars turn between the hamburger and the X: entering as the menu opens, leaving as it
// closes. The middle bar's fade is a state change either way, and stays under reduced motion while
// the bars snap.
const glyphTransition = (motion: string) => ({
  default: `transform ${motion}, opacity ${STATE_CHANGE}`,
  [REDUCED_MOTION]: `opacity ${STATE_CHANGE}`,
});

/**
 * The menu toggle's glyph.
 */
export const styles = stylex.create({
  // An icon's box, centred in the touch target; the glyph's own 24 × 20 drawing sits centred in it.
  glyph: {
    width: layout.icon,
    height: layout.icon,
  },
  // Every bar turns about a point of the glyph's own drawing.
  bar: {
    transformBox: 'view-box',
  },
  // About their own centres.
  top: {
    transformOrigin: `${MENU_GLYPH_WIDTH / 2}px ${MENU_GLYPH_TOP_ROW}px`,
  },
  bottom: {
    transformOrigin: `${MENU_GLYPH_WIDTH / 2}px ${MENU_GLYPH_BOTTOM_ROW}px`,
  },
  opening: {
    transition: glyphTransition(ENTERING),
  },
  closing: {
    transition: glyphTransition(LEAVING),
  },
  // Open, the outer bars slide to the middle row and swing onto the X's diagonals, and the middle
  // bar fades away.
  topOpen: {
    transform: `translateY(${GLYPH_SLIDE}px) rotate(${MENU_GLYPH_ANGLE_DEG}deg)`,
  },
  middleOpen: {
    opacity: 0,
  },
  bottomOpen: {
    transform: `translateY(${-GLYPH_SLIDE}px) rotate(${-MENU_GLYPH_ANGLE_DEG}deg)`,
  },
});

// The glyph shown inside the menu toggle — a hamburger when closed, an X
// when open. The three bars persist across the toggle; the morph between
// the two poses is StyleX (the styles above), so a
// state flip animates instead of swapping geometry.
export const menuGlyph = (open: boolean, h: HtmlBuilder<Message>): Html => {
  const bar = (row: number, ...variants: ReadonlyArray<StyleXStyle>): Html =>
    h.line([
      ...getStyleXAttributes(h, styles.bar, open ? styles.opening : styles.closing, ...variants),
      h.X1('0'),
      h.Y1(`${row}`),
      h.X2(`${MENU_GLYPH_WIDTH}`),
      h.Y2(`${row}`),
    ]);
  return h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      // Tight viewBox — the strokes' ink fills it edge to edge, so the CSS
      // size IS the visible size.
      h.ViewBox(`0 0 ${MENU_GLYPH_WIDTH} ${MENU_GLYPH_HEIGHT}`),
      ...getStyleXAttributes(h, styles.glyph),
      h.Fill('none'),
      h.Stroke('currentColor'),
      // A 3.43px bar at the glyph's 24px width, up from the drawn arrow’s
      // 2.5px weight.
      h.StrokeWidth(`${MENU_GLYPH_BAR}`),
      // Flat butt caps — the site’s whole graphic language is hard edges
      // (square chips, the drawn arrow); rounded line ends read soft.
      h.AriaHidden(true),
    ],
    [
      bar(MENU_GLYPH_TOP_ROW, styles.top, open && styles.topOpen),
      bar(MENU_GLYPH_MIDDLE_ROW, open && styles.middleOpen),
      bar(MENU_GLYPH_BOTTOM_ROW, styles.bottom, open && styles.bottomOpen),
    ],
  );
};

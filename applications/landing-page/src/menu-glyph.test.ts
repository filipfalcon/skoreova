import { describe, expect, test } from 'vite-plus/test';

import {
  MENU_GLYPH_ANGLE_DEG,
  MENU_GLYPH_BAR,
  MENU_GLYPH_BOTTOM_ROW,
  MENU_GLYPH_HEIGHT,
  MENU_GLYPH_MIDDLE_ROW,
  MENU_GLYPH_TOP_ROW,
  MENU_GLYPH_WIDTH,
} from './menu-glyph';

// The menu glyph's poses, recomputed from its drawing.
const radians = (degrees: number): number => (degrees * Math.PI) / 180;

// The height a bar of the glyph's length and thickness inks, turned by an angle: its centre line's
// rise, and its butt caps' reach past the line's ends.
const inkedHeight = (degrees: number): number =>
  MENU_GLYPH_WIDTH * Math.sin(radians(degrees)) + MENU_GLYPH_BAR * Math.cos(radians(degrees));

describe('the menu glyph', () => {
  test('inks its box edge to edge with the hamburger', () => {
    expect(MENU_GLYPH_TOP_ROW - MENU_GLYPH_BAR / 2).toBe(0);
    expect(MENU_GLYPH_BOTTOM_ROW + MENU_GLYPH_BAR / 2).toBe(MENU_GLYPH_HEIGHT);
    expect(MENU_GLYPH_MIDDLE_ROW).toBe(MENU_GLYPH_HEIGHT / 2);
  });

  test('turns its outer bars to the angle at which the X inks the same height', () => {
    const derived =
      (Math.asin(MENU_GLYPH_HEIGHT / Math.hypot(MENU_GLYPH_WIDTH, MENU_GLYPH_BAR)) -
        Math.atan(MENU_GLYPH_BAR / MENU_GLYPH_WIDTH)) *
      (180 / Math.PI);
    expect(MENU_GLYPH_ANGLE_DEG).toBeCloseTo(derived, 2);
    expect(inkedHeight(MENU_GLYPH_ANGLE_DEG)).toBeCloseTo(MENU_GLYPH_HEIGHT, 2);
  });

  test('keeps the X inside the box’s width', () => {
    const inkedWidth =
      MENU_GLYPH_WIDTH * Math.cos(radians(MENU_GLYPH_ANGLE_DEG)) +
      MENU_GLYPH_BAR * Math.sin(radians(MENU_GLYPH_ANGLE_DEG));
    expect(inkedWidth).toBeLessThan(MENU_GLYPH_WIDTH);
  });
});

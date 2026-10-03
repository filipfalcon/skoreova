import { DISPLAY_CUT, archivoAt } from '@skoreova/design/archivo';
import { describe, expect, test } from 'vite-plus/test';

import { HEADLINE_LINES, HEADLINE_WIDEST_EM } from './hero';

// The hero headline's size, recomputed from Archivo's advances at the display cut and from the
// scale's tokens, restated.
const display = archivoAt(DISPLAY_CUT);
const CAPS_TRACKING = 0.05;

// A line's advance in em, in capitals, kerned, with the tracking every character carries.
const advance = (text: string): number => {
  const capitals = text.toUpperCase();
  const run = display.layout(capitals);
  const kerned = run.positions.reduce((sum, position) => sum + position.xAdvance, 0);
  return kerned / display.unitsPerEm + [...capitals].length * CAPS_TRACKING;
};

const fluid = (minPx: number, maxPx: number, viewport: number): number => {
  const clamped = Math.min(Math.max(viewport, 320), 1280);
  return minPx + ((maxPx - minPx) * (clamped - 320)) / 960;
};
const step = (n: number, viewport: number): number =>
  fluid(16 * (6 / 5) ** n, 20 * (5 / 4) ** n, viewport);
const space = (multiplier: number, viewport: number): number =>
  fluid(16 * multiplier, 20 * multiplier, viewport);
const HEADER_HEIGHT = 64;
const MAX_WIDTH = 1280;
const CTA_HEIGHT = 64;

// The headline's size at a viewport, by each rule, and the one that holds.
const size = (width: number, height: number) => {
  const gutter = fluid(16, 40, width);
  const column = Math.min(width, MAX_WIDTH) - 2 * gutter;
  const byWidth = column / HEADLINE_WIDEST_EM;
  const cueLeading = step(-2, width) + space(0.5, width);
  const byHeight =
    (height -
      HEADER_HEIGHT -
      2 * space(2, width) -
      CTA_HEIGHT -
      cueLeading -
      3 * space(0.5, width)) /
    3;
  return { byWidth, byHeight, fontSize: Math.min(byWidth, byHeight) };
};

describe('the headline', () => {
  test('is widest at its last line, 5.0953em', () => {
    const widths = HEADLINE_LINES.map(advance);
    expect(widths.map((width) => Math.round(width * 10000) / 10000)).toEqual([
      4.5913, 4.6705, 5.0953,
    ]);
    expect(Math.max(...widths)).toBeCloseTo(HEADLINE_WIDEST_EM, 4);
  });

  test.each([
    [320, 700, 56.5, 'width'],
    [360, 700, 64.0, 'width'],
    [390, 700, 69.6, 'width'],
    [430, 700, 77.0, 'width'],
    [768, 432, 61.6, 'height'],
    [1280, 720, 153.1, 'height'],
    [1920, 1080, 235.5, 'width'],
  ])('sets %ix%ipx at %fpx, by its %s rule', (width, height, stated, rule) => {
    const { byWidth, byHeight, fontSize } = size(width, height);
    expect(fontSize).toBeCloseTo(stated, 1);
    expect(byWidth <= byHeight ? 'width' : 'height').toBe(rule);
  });
});

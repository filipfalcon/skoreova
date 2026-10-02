import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { create, type Font } from 'fontkit';
import { describe, expect, test } from 'vite-plus/test';

import { ARROW_GIVES_WAY_REM, CTA_GIVES_WAY_REM, LEAD_GIVES_WAY_REM } from './header';

// The header row's give-way widths, recomputed from Archivo's advances at the cuts the header sets
// its text in, and from the scale's tokens.
const loaded = create(
  readFileSync(createRequire(import.meta.url).resolve('@skoreova/design/font-source.ttf')),
);
if (!('variationAxes' in loaded)) throw new Error('the Archivo source is a collection');
const archivo: Font = loaded;

const DISPLAY_CUT = { wght: 700, wdth: 75 };
const CAPS_TRACKING = 0.05;

// A string's advance in em, kerned, with the tracking every character carries, the last included.
const advance = (text: string, cut: Record<string, number>, tracking: number): number => {
  const instance = archivo.getVariation(cut);
  const run = instance.layout(text);
  const kerned = run.positions.reduce((sum, position) => sum + position.xAdvance, 0);
  return kerned / instance.unitsPerEm + [...text].length * tracking;
};

// The drawn arrow beside the CTA's words: a 0.25em gap and a box of a 32 × 24 drawing as tall as the
// capitals.
const CAP_HEIGHT = archivo.capHeight / archivo.unitsPerEm;
const ARROW = 0.25 + (CAP_HEIGHT * 32) / 24;

const WORDMARK = advance('SKÓREOVÁ.', DISPLAY_CUT, CAPS_TRACKING);
const SHORT_CTA = advance('PLATFORM', DISPLAY_CUT, CAPS_TRACKING) + ARROW;
const LEAD = advance('ENTER ', DISPLAY_CUT, CAPS_TRACKING);

// The scale's axioms, restated, and Utopia's interpolation between them.
const fluid = (minPx: number, maxPx: number, viewport: number): number => {
  const clamped = Math.min(Math.max(viewport, 320), 1280);
  return minPx + ((maxPx - minPx) * (clamped - 320)) / 960;
};
const step = (n: number, viewport: number): number =>
  fluid(16 * (6 / 5) ** n, 20 * (5 / 4) ** n, viewport);
const space = (multiplier: number, viewport: number): number =>
  fluid(16 * multiplier, 20 * multiplier, viewport);
const TOUCH_TARGET = 48;
const ICON = 24;
// The logo's size: its capitals an icon tall, at every width.
const LOGO_SIZE = ICON / CAP_HEIGHT;

const row = (viewport: number) => {
  const xs = space(0.75, viewport);
  const xs2 = space(0.5, viewport);
  const wordmark = WORDMARK * LOGO_SIZE;
  const shortCta = SHORT_CTA * step(0, viewport) + 2 * space(1, viewport);
  const longCta = shortCta + LEAD * step(0, viewport);
  return {
    content: Math.min(viewport, 1280) - 2 * fluid(16, 40, viewport),
    longCta: wordmark + xs2 + longCta + xs + TOUCH_TARGET,
    shortCta: wordmark + xs2 + shortCta + xs + TOUCH_TARGET,
    noArrow: wordmark + xs2 + shortCta - ARROW * step(0, viewport) + xs + TOUCH_TARGET,
    noCta: wordmark + xs2 + TOUCH_TARGET,
  };
};

// The content width at the narrowest viewport where a row fits.
const fitsFrom = (key: 'longCta' | 'shortCta' | 'noArrow' | 'noCta'): number => {
  for (let viewport = 320; viewport <= 1280; viewport += 0.01) {
    const widths = row(viewport);
    if (widths[key] <= widths.content) return widths.content;
  }
  throw new Error(`${key} never fits`);
};

describe('the header row', () => {
  test('measures the advances its comments state', () => {
    expect(WORDMARK).toBeCloseTo(5.158, 3);
    expect(SHORT_CTA).toBeCloseTo(5.965, 3);
    expect(LEAD).toBeCloseTo(3.173, 3);
  });

  test('sets the logo at the icon over the cap height, 180.5px wide at every width', () => {
    expect(LOGO_SIZE / 16).toBeCloseTo(2.1866, 4);
    expect(WORDMARK * LOGO_SIZE).toBeCloseTo(180.5, 1);
  });

  test.each([
    ['the first word', LEAD_GIVES_WAY_REM, fitsFrom('longCta'), 434.6],
    ['the arrow', ARROW_GIVES_WAY_REM, fitsFrom('shortCta'), 379.6],
    ['the CTA', CTA_GIVES_WAY_REM, fitsFrom('noArrow'), 359.8],
  ])(
    'gives %s way within a quarter rem above where the row stops fitting',
    (_name, rem, fits, stated) => {
      expect(fits).toBeCloseTo(stated, 1);
      expect(rem * 16).toBeGreaterThanOrEqual(fits);
      expect(rem * 16 - fits).toBeLessThan(4);
    },
  );

  test('gives way in order: first word, arrow, CTA', () => {
    expect(LEAD_GIVES_WAY_REM).toBeGreaterThan(ARROW_GIVES_WAY_REM);
    expect(ARROW_GIVES_WAY_REM).toBeGreaterThan(CTA_GIVES_WAY_REM);
  });

  test('fits the logo and the menu at every width: 236.5px of the 288px row at 320', () => {
    expect(fitsFrom('noCta')).toBe(288);
    expect(row(320).noCta).toBeCloseTo(236.5, 1);
  });

  // The row each state renders at a viewport, after give-way, and the width it leaves spare.
  const spare = (viewport: number, ctaShown: boolean): number => {
    const widths = row(viewport);
    const rem = widths.content / 16;
    const asked =
      !ctaShown || rem <= CTA_GIVES_WAY_REM
        ? widths.noCta
        : rem <= ARROW_GIVES_WAY_REM
          ? widths.noArrow
          : rem <= LEAD_GIVES_WAY_REM
            ? widths.shortCta
            : widths.longCta;
    return widths.content - asked;
  };

  test.each([
    // Logo and menu; shown, the CTA gave way.
    [320, false, 51.5],
    [320, true, 51.5],
    [360, false, 89.5],
    [360, true, 89.5],
    // Logo and menu; shown, logo, "Platform" with its arrow, and menu.
    [430, false, 155.8],
    [430, true, 12.4],
  ])('leaves room to spare at %ipx, CTA shown: %s, %fpx', (viewport, ctaShown, stated) => {
    expect(spare(viewport, ctaShown)).toBeCloseTo(stated, 1);
  });

  test('never overflows, CTA hidden or shown, at any width', () => {
    for (let viewport = 320; viewport <= 1280; viewport += 0.5) {
      expect(spare(viewport, false)).toBeGreaterThanOrEqual(0);
      expect(spare(viewport, true)).toBeGreaterThanOrEqual(0);
    }
  });
});

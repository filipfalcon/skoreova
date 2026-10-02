import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { create, type Font } from 'fontkit';
import { describe, expect, test } from 'vite-plus/test';

import {
  ARROW_GIVES_WAY_REM,
  CTA_GIVES_WAY_REM,
  LABEL_GIVES_WAY_REM,
  LEAD_GIVES_WAY_REM,
} from './styles/header';

// The header row's give-way widths, recomputed from Archivo's advances at the cuts the header sets
// its text in, and from the scale's tokens.
const loaded = create(
  readFileSync(createRequire(import.meta.url).resolve('@skoreova/design/font-source.ttf')),
);
if (!('variationAxes' in loaded)) throw new Error('the Archivo source is a collection');
const archivo: Font = loaded;

const DISPLAY_CUT = { wght: 700, wdth: 75 };
const BODY_CUT = { wght: 400, wdth: 100 };
const CAPS_TRACKING = 0.05;

// A string's advance in em, kerned, with the tracking every character carries, the last included.
const advance = (text: string, cut: Record<string, number>, tracking: number): number => {
  const instance = archivo.getVariation(cut);
  const run = instance.layout(text);
  const kerned = run.positions.reduce((sum, position) => sum + position.xAdvance, 0);
  return kerned / instance.unitsPerEm + [...text].length * tracking;
};

// The drawn arrow beside a CTA's label: a 0.25em gap and a box of a 32 × 24 drawing as tall as the
// capitals.
const CAP_HEIGHT = archivo.capHeight / archivo.unitsPerEm;
const ARROW = 0.25 + (CAP_HEIGHT * 32) / 24;

const WORDMARK = advance('SKÓREOVÁ.', DISPLAY_CUT, CAPS_TRACKING);
// The label's right padding gives its trailing tracking back.
const LABEL = advance('BETA', BODY_CUT, CAPS_TRACKING) - CAPS_TRACKING;
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
const HAIRLINE = 1;

const row = (viewport: number) => {
  const xs = space(0.75, viewport);
  const xs2 = space(0.5, viewport);
  const wordmark = WORDMARK * step(2, viewport);
  const label = LABEL * step(-2, viewport) + 2 * xs2 + 2 * HAIRLINE;
  const shortCta = SHORT_CTA * step(0, viewport) + 2 * space(1, viewport);
  const longCta = shortCta + LEAD * step(0, viewport);
  return {
    content: Math.min(viewport, 1280) - 2 * fluid(16, 40, viewport),
    withLabel: wordmark + xs + label + xs2 + longCta + xs + TOUCH_TARGET,
    withoutLabel: wordmark + xs2 + longCta + xs + TOUCH_TARGET,
    shortCta: wordmark + xs2 + shortCta + xs + TOUCH_TARGET,
    noArrow: wordmark + xs2 + shortCta - ARROW * step(0, viewport) + xs + TOUCH_TARGET,
    noCta: wordmark + xs2 + TOUCH_TARGET,
    labelNoCta: wordmark + xs + label + xs2 + TOUCH_TARGET,
  };
};

// The content width at the narrowest viewport where a row fits.
const fitsFrom = (key: 'withLabel' | 'withoutLabel' | 'shortCta' | 'noArrow'): number => {
  for (let viewport = 320; viewport <= 1280; viewport += 0.01) {
    const widths = row(viewport);
    if (widths[key] <= widths.content) return widths.content;
  }
  throw new Error(`${key} never fits`);
};

describe('the header row', () => {
  test('measures the advances its comments state', () => {
    expect(WORDMARK).toBeCloseTo(5.158, 3);
    expect(LABEL).toBeCloseTo(2.725, 3);
    expect(SHORT_CTA).toBeCloseTo(5.965, 3);
    expect(LEAD).toBeCloseTo(3.173, 3);
  });

  test.each([
    ['the label', LABEL_GIVES_WAY_REM, fitsFrom('withLabel'), 442.9],
    ['the first word', LEAD_GIVES_WAY_REM, fitsFrom('withoutLabel'), 373.7],
    ['the arrow', ARROW_GIVES_WAY_REM, fitsFrom('shortCta'), 316.8],
    ['the CTA', CTA_GIVES_WAY_REM, fitsFrom('noArrow'), 296.3],
  ])(
    'gives %s way within a quarter rem above where the row stops fitting',
    (_name, rem, fits, stated) => {
      expect(fits).toBeCloseTo(stated, 1);
      expect(rem * 16).toBeGreaterThanOrEqual(fits);
      expect(rem * 16 - fits).toBeLessThan(4);
    },
  );

  test('overflows at 320 without the arrow, 7.7px over, and fits with the CTA gone, 113.2px spare', () => {
    const widths = row(320);
    expect(widths.content).toBe(288);
    expect(widths.content - widths.noArrow).toBeCloseTo(-7.7, 1);
    expect(widths.noCta).toBeCloseTo(174.8, 1);
    expect(widths.content - widths.noCta).toBeCloseTo(113.2, 1);
  });

  test('fits the label again once the CTA is gone: 235.1px of the 288px row at 320, 52.9px spare', () => {
    const widths = row(320);
    expect(widths.labelNoCta).toBeCloseTo(235.1, 1);
    expect(widths.content - widths.labelNoCta).toBeCloseTo(52.9, 1);
  });

  test('hides the label only between the CTA’s give-way width and its own', () => {
    expect(CTA_GIVES_WAY_REM).toBeLessThan(LABEL_GIVES_WAY_REM);
  });

  test('gives the CTA way only below a 329px viewport', () => {
    const viewport = 328.78;
    expect(row(viewport).content).toBeCloseTo(fitsFrom('noArrow'), 1);
  });
});

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { create, type Font } from 'fontkit';
import { describe, expect, test } from 'vite-plus/test';

import { ARROW_GIVES_WAY_REM, CTA_GIVES_WAY_REM, LEAD_GIVES_WAY_REM } from './header';
import { logoVariants } from './data';
import { MENU_GLYPH_HEIGHT, MENU_GLYPH_WIDTH } from './menu-glyph';

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
// The menu glyph's drawing takes its icon box's width, so it stands icon × height ÷ width tall.
const GLYPH_DRAWN_HEIGHT = (ICON * MENU_GLYPH_HEIGHT) / MENU_GLYPH_WIDTH;
// The logo's size: its capitals as tall as the glyph's drawn bars, at every width.
const LOGO_SIZE = GLYPH_DRAWN_HEIGHT / CAP_HEIGHT;

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

// The logo's period is an element of its own, which engines may shape apart from the name: the split
// is safe only where the font joins nothing across it.
describe('the logo’s period, SKÓREOVÁ | .', () => {
  const display = archivo.getVariation(DISPLAY_CUT);
  const run = (text: string) => display.layout(text);

  test('kerns nothing against the name', () => {
    const advanceOf = (text: string): number =>
      run(text).positions.reduce((total, position) => total + position.xAdvance, 0);
    expect(advanceOf('SKÓREOVÁ.')).toBeCloseTo(advanceOf('SKÓREOVÁ') + advanceOf('.'), 6);
  });

  test('substitutes nothing across the split', () => {
    const ids = (text: string): ReadonlyArray<number> => run(text).glyphs.map((glyph) => glyph.id);
    expect(ids('SKÓREOVÁ.')).toEqual([...ids('SKÓREOVÁ'), ...ids('.')]);
  });
});

// The logo's idle variants draw over the logo's own letters, so each must render no wider than the
// logo itself. Measured per piece, as they render: the variant's word is an element of its own, and
// WebKit shapes each inline element apart, so no kerning joins the pieces.
describe('the logo’s idle variants', () => {
  const pieces = (...texts: ReadonlyArray<string>): number =>
    texts.reduce(
      (total, text) => total + advance(text.toUpperCase(), DISPLAY_CUT, CAPS_TRACKING),
      0,
    );
  const logoWidth = pieces('Skóreová', '.') * LOGO_SIZE;

  test.each(logoVariants.map((variant) => [variant.word, variant] as const))(
    '%s keeps the logo’s own first and last letters',
    (_word, variant) => {
      expect('Skóreová'.startsWith(variant.start)).toBe(true);
      expect('Skóreová'.endsWith(variant.end)).toBe(true);
    },
  );

  test.each([
    ['Slay', 134.18],
    ['Periodt', 148.99],
    ['Queen', 142.94],
  ])('%s renders %fpx wide, within the logo’s 150.39px', (word, stated) => {
    const variant = logoVariants.find((candidate) => candidate.word === word);
    if (variant === undefined) throw new Error(`no ${word} variant`);
    const width = pieces(variant.start, variant.word, variant.end) * LOGO_SIZE;
    expect(logoWidth).toBeCloseTo(150.39, 2);
    expect(width).toBeCloseTo(stated, 2);
    expect(width).toBeLessThanOrEqual(logoWidth);
  });

  test('every variant fits', () => {
    for (const variant of logoVariants) {
      expect(pieces(variant.start, variant.word, variant.end) * LOGO_SIZE).toBeLessThanOrEqual(
        logoWidth,
      );
    }
  });
});

describe('the header row', () => {
  test('measures the advances its comments state', () => {
    expect(WORDMARK).toBeCloseTo(5.158, 3);
    expect(SHORT_CTA).toBeCloseTo(5.965, 3);
    expect(LEAD).toBeCloseTo(3.173, 3);
  });

  test('sets the logo at the glyph’s drawn height over the cap height, 150.4px wide', () => {
    expect(GLYPH_DRAWN_HEIGHT).toBe(20);
    expect(LOGO_SIZE / 16).toBeCloseTo(1.8222, 4);
    expect(WORDMARK * LOGO_SIZE).toBeCloseTo(150.4, 1);
  });

  test.each([
    ['the first word', LEAD_GIVES_WAY_REM, fitsFrom('longCta'), 402.8],
    ['the arrow', ARROW_GIVES_WAY_REM, fitsFrom('shortCta'), 348.3],
    ['the CTA', CTA_GIVES_WAY_REM, fitsFrom('noArrow'), 328.6],
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

  test('fits the logo and the menu at every width: 206.4px of the 288px row at 320', () => {
    expect(fitsFrom('noCta')).toBe(288);
    expect(row(320).noCta).toBeCloseTo(206.4, 1);
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
    [320, false, 81.6],
    [320, true, 81.6],
    [360, false, 119.5],
    [360, true, 119.5],
    // Logo and menu; shown, logo, "Platform" without its arrow, and menu.
    [375, false, 133.7],
    [375, true, 11.2],
    // Logo and menu; shown, logo, "Platform" with its arrow, and menu.
    [390, false, 148.0],
    [390, true, 6.0],
    [430, false, 185.9],
    [430, true, 42.4],
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

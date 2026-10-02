import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { create, type Font } from 'fontkit';
import { describe, expect, test, vi } from 'vite-plus/test';

import { font } from './font.stylex';

// Unbuilt, `defineVars` hands back its own argument, so each var reads as the value the StyleX
// compiler evaluates for it.
vi.mock('@stylexjs/stylex', () => ({ defineVars: <Vars>(vars: Vars): Vars => vars }));

const FONT_FILE = fileURLToPath(new URL('./font/archivo.woff2', import.meta.url));
const SOURCE_FILE = fileURLToPath(
  new URL('../fonts/source/Archivo[wdth,wght].ttf', import.meta.url),
);
const CSS_FILE = fileURLToPath(new URL('./font/archivo.css', import.meta.url));

const open = (path: string): Font => {
  const loaded = create(readFileSync(path));
  if (!('variationAxes' in loaded)) throw new Error(`${path} is a collection`);
  return loaded;
};

// The shipped file. Its parser cannot instance a WOFF2 at other coordinates, so the cuts are
// measured on the source it is built from, which it matches at the default instance.
const archivo = open(FONT_FILE);
const source = open(SOURCE_FILE);
const BODY_CUT = { wght: 400, wdth: 100 };

const axis = (tag: string): { min: number; max: number } => {
  const found = archivo.variationAxes[tag];
  if (found === undefined) throw new Error(`no ${tag} axis`);
  return found;
};

const percent = (value: string): number => Number(value.replace('%', ''));

// The same weighting the build script matches the fallback with: English letter frequencies, with
// the word space.
const FREQUENCIES: Record<string, number> = {
  e: 12.7,
  t: 9.06,
  a: 8.17,
  o: 7.51,
  i: 6.97,
  n: 6.75,
  s: 6.33,
  h: 6.09,
  r: 5.99,
  d: 4.25,
  l: 4.03,
  c: 2.78,
  u: 2.76,
  m: 2.41,
  w: 2.36,
  f: 2.23,
  g: 2.02,
  y: 1.97,
  p: 1.93,
  b: 1.29,
  v: 0.98,
  k: 0.77,
  j: 0.15,
  x: 0.15,
  q: 0.095,
  z: 0.074,
  ' ': 18,
};
const ARIAL_AVERAGE_ADVANCE = 0.44678;

describe('the font file', () => {
  test('is Archivo, first in the family', () => {
    expect(archivo.familyName.startsWith('Archivo')).toBe(true);
    expect(font.family.startsWith("'Archivo', ")).toBe(true);
  });

  test('spans weight from the body cut to the display cut and bold', () => {
    expect(axis('wght')).toMatchObject({ min: Number(font['body-weight']), max: 700 });
    expect(font['display-weight']).toBe('700');
    expect(font['bold-weight']).toBe('700');
  });

  test('spans width from the display cut to the body cut', () => {
    expect(axis('wdth')).toMatchObject({
      min: percent(font['display-width']),
      max: percent(font['body-width']),
    });
  });

  test('carries tabular figures for the data numerals', () => {
    expect(archivo.availableFeatures).toContain('tnum');
    expect(font['data-numerals']).toBe('tabular-nums');
  });

  test('draws its default instance as the source does', () => {
    for (const char of 'SKÓREOVÁ. Platform 0123456789') {
      const codePoint = Number(char.codePointAt(0));
      expect(archivo.glyphForCodePoint(codePoint).advanceWidth).toBeCloseTo(
        source.glyphForCodePoint(codePoint).advanceWidth,
        6,
      );
    }
  });
});

describe('the fallback face', () => {
  const css = readFileSync(CSS_FILE, 'utf8');
  const fallback = css.slice(css.indexOf("'Archivo Fallback'"));
  const declared = (property: string): number => {
    const match = new RegExp(`${property}: ([\\d.]+)%`).exec(fallback);
    if (match === null) throw new Error(`no ${property}`);
    return Number(match[1]);
  };
  const body = source.getVariation(BODY_CUT);
  const total = Object.values(FREQUENCIES).reduce((sum, weight) => sum + weight, 0);
  const average =
    Object.entries(FREQUENCIES).reduce(
      (sum, [char, weight]) =>
        sum + body.glyphForCodePoint(Number(char.codePointAt(0))).advanceWidth * weight,
      0,
    ) /
    total /
    body.unitsPerEm;
  const sizeAdjust = average / ARIAL_AVERAGE_ADVANCE;
  const asPercent = (value: number): number => value * 100;

  // The shipped file stores the body cut as an axis end, its advances rounded to whole units, where
  // the source interpolates them: half a unit in a thousand at most, so the two agree to within
  // 0.05 of a percentage point.
  test('scales the system sans to the body cut’s average advance', () => {
    expect(declared('size-adjust')).toBeCloseTo(asPercent(sizeAdjust), 1);
  });

  test('carries Archivo’s ascent, descent and line gap', () => {
    expect(declared('ascent-override')).toBeCloseTo(
      asPercent(body.ascent / body.unitsPerEm / sizeAdjust),
      1,
    );
    expect(declared('descent-override')).toBeCloseTo(
      asPercent(-body.descent / body.unitsPerEm / sizeAdjust),
      1,
    );
    expect(declared('line-gap-override')).toBe(asPercent(body.lineGap / body.unitsPerEm));
  });
});

describe('the cap height', () => {
  const em = (units: number): string => `${units / source.unitsPerEm}em`;

  test('is the font’s own', () => {
    expect(font['cap-height']).toBe(em(archivo.capHeight));
    expect(source.capHeight).toBe(archivo.capHeight);
  });

  // The display cut's capitals interpolate to 687 units, a thousandth of an em over the stated 686.
  test.each([
    ['body', BODY_CUT],
    ['display', { wght: 700, wdth: 75 }],
  ])('is the height of the %s cut’s flat capitals, to a unit', (_name, cut) => {
    const instance = source.getVariation(cut);
    for (const char of 'EHIT') {
      const { minY, maxY } = instance.glyphForCodePoint(Number(char.codePointAt(0))).bbox;
      expect(minY).toBe(0);
      expect(Math.abs(maxY - archivo.capHeight)).toBeLessThanOrEqual(1);
    }
  });
});

describe('caps tracking', () => {
  test('is the lower bound of 5 to 10% of the type size', () => {
    expect(font['caps-tracking']).toBe('0.05em');
  });
});

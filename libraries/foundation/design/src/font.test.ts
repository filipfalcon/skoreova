import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { Font } from 'fontkit';
import { describe, expect, test, vi } from 'vite-plus/test';

import {
  ARCHIVO_FILES,
  BODY_CUT,
  DISPLAY_CUT,
  MONUMENT_CUT,
  archivoAt,
  openArchivo,
} from './archivo';
import { ARCHIVO_CAPITALS } from './archivo-capitals';
import { font } from './font.stylex';

// Unbuilt, `defineVars` hands back its own argument, so each var reads as the value the StyleX
// compiler evaluates for it.
vi.mock('@stylexjs/stylex', () => ({ defineVars: <Vars>(vars: Vars): Vars => vars }));

const CSS = readFileSync(fileURLToPath(new URL('./font/archivo.css', import.meta.url)), 'utf8');

// The rule that declares a family, or a subset's file.
const rule = (marker: string): string => {
  const at = CSS.indexOf(marker);
  if (at === -1) throw new Error(`no rule for ${marker}`);
  return CSS.slice(CSS.lastIndexOf('@font-face', at), CSS.indexOf('}', at));
};

// A descriptor's value, as declared.
const descriptor = (block: string, name: string): string => {
  const match = new RegExp(`${name}:\\s*([^;]+);`).exec(block);
  if (match?.[1] === undefined) throw new Error(`no ${name}`);
  return match[1].trim();
};

// A fraction as CSS declares it: a percentage to two decimals.
const asPercent = (value: number): string => `${Math.round(value * 10000) / 100}%`;

const SUBSETS: ReadonlyArray<keyof typeof ARCHIVO_FILES> = ['latin', 'latin-ext'];
const archivo = openArchivo();

describe('the font files', () => {
  test('are the two subsets', () => {
    expect(Object.keys(ARCHIVO_FILES)).toEqual(SUBSETS);
  });

  test.each(SUBSETS)('%s is Archivo over the full axes, which cover the language’s', (subset) => {
    const file = openArchivo(subset);
    expect(file.familyName.startsWith('Archivo')).toBe(true);
    expect(file.variationAxes['wght']).toMatchObject({ min: 100, max: 900 });
    expect(file.variationAxes['wdth']).toMatchObject({ min: 62, max: 125 });
  });

  // The figures are in the latin subset's range.
  test('latin carries tabular figures for the data numerals', () => {
    expect(openArchivo('latin').availableFeatures).toContain('tnum');
  });
});

describe('the faces', () => {
  // The ranges as declared, as code point intervals.
  const rangeOf = (subset: string): ReadonlyArray<readonly [number, number]> =>
    descriptor(rule(`archivo-${subset}.woff2`), 'unicode-range')
      .split(',')
      .map((part) => {
        const [from, to] = part.trim().slice(2).split('-');
        const start = Number.parseInt(String(from), 16);
        return [start, to === undefined ? start : Number.parseInt(to, 16)] as const;
      });
  const inRange = (subset: string, codePoint: number): boolean =>
    rangeOf(subset).some(([from, to]) => codePoint >= from && codePoint <= to);
  const drawn = new Set(SUBSETS.flatMap((subset) => openArchivo(subset).characterSet));

  test.each(SUBSETS)('%s declares the weights, widths and swap the language uses', (subset) => {
    const face = rule(`archivo-${subset}.woff2`);
    expect(descriptor(face, 'font-family')).toBe("'Archivo'");
    expect(descriptor(face, 'font-weight')).toBe(
      `${font['body-weight']} ${font['monument-weight']}`,
    );
    expect(descriptor(face, 'font-stretch')).toBe(
      `${font['monument-width']} ${font['body-width']}`,
    );
    expect(descriptor(face, 'font-display')).toBe('swap');
  });

  // Google's ranges overlap (the general punctuation block in latin's, dotless i and the OE
  // ligatures in latin-ext's), and the browser picks, per character, among the faces whose range
  // names it the one that draws it. So every character Archivo draws in some declared range must be
  // drawn by a file whose range names it.
  test('draw every character their ranges name that Archivo draws', () => {
    const files = new Map(
      SUBSETS.map((subset) => [subset, new Set(openArchivo(subset).characterSet)] as const),
    );
    const unserved = [...drawn].filter(
      (codePoint) =>
        SUBSETS.some((subset) => inRange(subset, codePoint)) &&
        !SUBSETS.some((subset) => inRange(subset, codePoint) && files.get(subset)?.has(codePoint)),
    );
    expect(unserved.map((codePoint) => codePoint.toString(16))).toEqual([]);
  });

  test('cover the Czech alphabet between them', () => {
    for (const char of 'áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ') {
      const codePoint = Number(char.codePointAt(0));
      expect(SUBSETS.some((subset) => inRange(subset, codePoint))).toBe(true);
      expect(drawn.has(codePoint)).toBe(true);
    }
  });
});

// English letter frequencies, with the word space: the weighting a line of running text is made of.
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

// A cut's average advance by that weighting, in em: of running text, or of capitals.
const averageAdvance = (cut: Font, capitals: boolean): number => {
  const total = Object.values(FREQUENCIES).reduce((sum, weight) => sum + weight, 0);
  const weighted = Object.entries(FREQUENCIES).reduce((sum, [char, weight]) => {
    const glyph = cut.glyphForCodePoint(
      Number((capitals ? char.toUpperCase() : char).codePointAt(0)),
    );
    return sum + glyph.advanceWidth * weight;
  }, 0);
  return weighted / total / cut.unitsPerEm;
};

// The system faces the fallbacks draw on, with their average advance by the same weighting, in em,
// measured from each face's hmtx table: Arial 5.01 for running text (Liberation Sans shares its
// advances), and for capitals Helvetica Neue Condensed Bold 22.0d2e1, Arial Narrow Bold 2.38.1x,
// Arial Bold 5.01.2x (Liberation Sans Bold shares its advances), Helvetica Neue Condensed Black
// 22.0d2e1. Each with the cut it stands in for and the weight it is declared at.
const FALLBACKS = [
  ['Archivo Fallback', 0.44678, BODY_CUT, undefined],
  ['Archivo Display Fallback Condensed', 0.47607, DISPLAY_CUT, '700'],
  ['Archivo Display Fallback Narrow', 0.50279, DISPLAY_CUT, '700'],
  ['Archivo Display Fallback', 0.61323, DISPLAY_CUT, '700'],
  ['Archivo Monument Fallback Condensed', 0.48589, MONUMENT_CUT, '900'],
  ['Archivo Monument Fallback Narrow', 0.50279, MONUMENT_CUT, '900'],
  ['Archivo Monument Fallback', 0.61323, MONUMENT_CUT, '900'],
] as const;

describe('the fallback faces', () => {
  test.each(FALLBACKS)(
    '%s matches its cut’s average advance and carries Archivo’s vertical metrics',
    (family, systemAdvance, standsInFor) => {
      const capitals = standsInFor !== BODY_CUT;
      const cut = archivoAt(standsInFor);
      const face = rule(`'${family}';`);
      const sizeAdjust = averageAdvance(cut, capitals) / systemAdvance;
      const em = (units: number): number => units / cut.unitsPerEm;
      expect(descriptor(face, 'size-adjust')).toBe(asPercent(sizeAdjust));
      expect(descriptor(face, 'ascent-override')).toBe(asPercent(em(cut.ascent) / sizeAdjust));
      expect(descriptor(face, 'descent-override')).toBe(asPercent(em(-cut.descent) / sizeAdjust));
      expect(descriptor(face, 'line-gap-override')).toBe(asPercent(em(cut.lineGap) / sizeAdjust));
    },
  );

  test('stand in at their cut’s weight, so none is drawn bolder by synthesis', () => {
    for (const [family, , standsInFor, weight] of FALLBACKS) {
      if (weight !== undefined) {
        expect(descriptor(rule(`'${family}';`), 'font-weight')).toBe(weight);
        expect(weight).toBe(String(standsInFor.wght));
      }
    }
  });

  test('follow Archivo in each cut’s family, display fallbacks in the display family', () => {
    expect(font.family).toBe("'Archivo', 'Archivo Fallback', sans-serif");
    expect(font['display-family']).toBe(
      "'Archivo', 'Archivo Display Fallback Condensed', 'Archivo Display Fallback Narrow', 'Archivo Display Fallback', sans-serif",
    );
    expect(font['monument-family']).toBe(
      "'Archivo', 'Archivo Monument Fallback Condensed', 'Archivo Monument Fallback Narrow', 'Archivo Monument Fallback', sans-serif",
    );
  });
});

describe('the cuts', () => {
  test('span the axes the faces declare', () => {
    expect(BODY_CUT).toEqual({
      wght: Number(font['body-weight']),
      wdth: Number.parseFloat(font['body-width']),
    });
    expect(DISPLAY_CUT).toEqual({
      wght: Number(font['display-weight']),
      wdth: Number.parseFloat(font['display-width']),
    });
    expect(MONUMENT_CUT).toEqual({
      wght: Number(font['monument-weight']),
      wdth: Number.parseFloat(font['monument-width']),
    });
    expect(font['bold-weight']).toBe('700');
    expect(font['data-numerals']).toBe('tabular-nums');
  });
});

describe('the cap height', () => {
  test('is the font’s own, as a share of the type size', () => {
    expect(font['cap-height']).toBe(String(archivo.capHeight / archivo.unitsPerEm));
  });

  // Outlines read from a WOFF2 file stay at its default instance (see archivoAt), so this checks the default instance's flat capitals; a varied cut's are measured in the browser.
  test('is the height of the default instance’s flat capitals, to a unit', () => {
    for (const char of 'EHIT') {
      const { minY, maxY } = archivo.glyphForCodePoint(Number(char.codePointAt(0))).bbox;
      expect(minY).toBe(0);
      expect(Math.abs(maxY - archivo.capHeight)).toBeLessThanOrEqual(1);
    }
  });
});

describe('the capitals', () => {
  // Their list, for the browser test that measures the caps leading; the character maps are unvaried data.
  test('are every capital the files draw', () => {
    const drawn = [...new Set(SUBSETS.flatMap((subset) => openArchivo(subset).characterSet))]
      .filter((codePoint) => /\p{Lu}/u.test(String.fromCodePoint(codePoint)))
      .sort((a, b) => a - b)
      .map((codePoint) => String.fromCodePoint(codePoint))
      .join('');
    expect(ARCHIVO_CAPITALS).toBe(drawn);
  });
});

describe('caps tracking', () => {
  test('is the lower bound of 5 to 10% of the type size', () => {
    expect(font['caps-tracking']).toBe('0.05em');
  });
});

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { Font } from 'fontkit';
import { describe, expect, test, vi } from 'vite-plus/test';

import { openAnton } from './anton';
import { ARCHIVO_FILES, BODY_CUT, DISPLAY_CUT, archivoAt, openArchivo } from './archivo';
import { font } from './font.stylex';

// Unbuilt, `defineVars` hands back its own argument, so each var reads as the value the StyleX
// compiler evaluates for it.
vi.mock('@stylexjs/stylex', () => ({ defineVars: <Vars>(vars: Vars): Vars => vars }));

const sheet = (file: string): string =>
  readFileSync(fileURLToPath(new URL(`./font/${file}`, import.meta.url)), 'utf8');
const CSS = sheet('archivo.css');
const BRAND_CSS = sheet('anton.css');

// The rule in a sheet that declares a family, or a subset's file.
const ruleIn = (css: string, marker: string): string => {
  const at = css.indexOf(marker);
  if (at === -1) throw new Error(`no rule for ${marker}`);
  return css.slice(css.lastIndexOf('@font-face', at), css.indexOf('}', at));
};
const rule = (marker: string): string => ruleIn(CSS, marker);

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
      `${font['body-weight']} ${font['display-weight']}`,
    );
    expect(descriptor(face, 'font-stretch')).toBe(`${font['display-width']} ${font['body-width']}`);
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
// Arial Bold 5.01.2x (Liberation Sans Bold shares its advances). Each with the cut it stands in
// for and the weight it is declared at.
const FALLBACKS = [
  ['Archivo Fallback', 0.44678, BODY_CUT, undefined],
  ['Archivo Display Fallback Condensed', 0.47607, DISPLAY_CUT, '700'],
  ['Archivo Display Fallback Narrow', 0.50279, DISPLAY_CUT, '700'],
  ['Archivo Display Fallback', 0.61323, DISPLAY_CUT, '700'],
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

describe('caps tracking', () => {
  test('is the lower bound of 5 to 10% of the type size', () => {
    expect(font['caps-tracking']).toBe('0.05em');
  });
});

// The brand face's system fallbacks, with their average capital advance by the same weighting, in
// em, from each face's hmtx table: Impact 5.00x, Arial Narrow Bold 2.38.1x, Arial Bold 5.01.2x
// (Liberation Sans Bold shares its advances).
const BRAND_FALLBACKS = [
  ['Anton Fallback Impact', 0.44768],
  ['Anton Fallback Narrow', 0.50279],
  ['Anton Fallback', 0.61323],
] as const;

describe('the brand face', () => {
  const anton = openAnton();

  test.each(SUBSETS)('%s is Anton, a static font', (subset) => {
    const file = openAnton(subset);
    expect(file.familyName).toBe('Anton');
    expect(file.variationAxes).toEqual({});
  });

  test.each(SUBSETS)('%s declares Anton’s one weight, swap and Archivo’s range', (subset) => {
    const face = ruleIn(BRAND_CSS, `anton-${subset}.woff2`);
    expect(descriptor(face, 'font-family')).toBe("'Anton'");
    expect(descriptor(face, 'font-weight')).toBe(font['brand-weight']);
    expect(descriptor(face, 'font-display')).toBe('swap');
    expect(descriptor(face, 'unicode-range')).toBe(
      descriptor(rule(`archivo-${subset}.woff2`), 'unicode-range'),
    );
  });

  test('covers the Czech alphabet', () => {
    const drawn = new Set(SUBSETS.flatMap((subset) => openAnton(subset).characterSet));
    for (const char of 'áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ') {
      expect(drawn.has(Number(char.codePointAt(0)))).toBe(true);
    }
  });

  test.each(BRAND_FALLBACKS)(
    '%s matches Anton’s average capital advance and carries its vertical metrics',
    (family, systemAdvance) => {
      const face = ruleIn(BRAND_CSS, `'${family}';`);
      const sizeAdjust = averageAdvance(anton, true) / systemAdvance;
      const em = (units: number): number => units / anton.unitsPerEm;
      expect(descriptor(face, 'size-adjust')).toBe(asPercent(sizeAdjust));
      expect(descriptor(face, 'ascent-override')).toBe(asPercent(em(anton.ascent) / sizeAdjust));
      expect(descriptor(face, 'descent-override')).toBe(asPercent(em(-anton.descent) / sizeAdjust));
      expect(descriptor(face, 'line-gap-override')).toBe(asPercent(em(anton.lineGap) / sizeAdjust));
      expect(descriptor(face, 'font-weight')).toBe(font['brand-weight']);
    },
  );

  test('follows Anton with its fallbacks in the brand family', () => {
    expect(font['brand-family']).toBe(
      "'Anton', 'Anton Fallback Impact', 'Anton Fallback Narrow', 'Anton Fallback', sans-serif",
    );
  });
});

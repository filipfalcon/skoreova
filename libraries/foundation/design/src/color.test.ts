import {
  DynamicScheme,
  Hct,
  MaterialDynamicColors,
  SchemeFidelity,
  TonalPalette,
  Variant,
  argbFromHex,
  hexFromArgb,
} from '@material/material-color-utilities';
import { describe, expect, test, vi } from 'vite-plus/test';

import { brand, chrome, color, focus } from './color.stylex';
import { space } from './scale.stylex';

// Unbuilt, `defineVars` hands back its own argument, so each var reads as the value the StyleX
// compiler evaluates for it.
vi.mock('@stylexjs/stylex', () => ({ defineVars: <Vars>(vars: Vars): Vars => vars }));

// The sources, restated: a change on either side fails here until both agree.
const PRIMARY_SOURCE = Hct.fromInt(argbFromHex('#ff2f8e'));
const NEUTRAL_SOURCE = Hct.fromInt(argbFromHex('#f3efe8'));

const fidelity = new SchemeFidelity(PRIMARY_SOURCE, true, 0);
const scheme = new DynamicScheme({
  sourceColorHct: PRIMARY_SOURCE,
  variant: Variant.FIDELITY,
  contrastLevel: 0,
  isDark: true,
  specVersion: '2021',
  primaryPalette: fidelity.primaryPalette,
  secondaryPalette: fidelity.secondaryPalette,
  tertiaryPalette: fidelity.tertiaryPalette,
  neutralPalette: TonalPalette.fromHueAndChroma(NEUTRAL_SOURCE.hue, NEUTRAL_SOURCE.chroma),
  neutralVariantPalette: TonalPalette.fromHueAndChroma(
    NEUTRAL_SOURCE.hue,
    NEUTRAL_SOURCE.chroma + 4,
  ),
});
const roles = new MaterialDynamicColors();

const ROLES = [
  ['surface', roles.surface()],
  ['surface-container-lowest', roles.surfaceContainerLowest()],
  ['surface-container-low', roles.surfaceContainerLow()],
  ['surface-container', roles.surfaceContainer()],
  ['surface-container-high', roles.surfaceContainerHigh()],
  ['surface-container-highest', roles.surfaceContainerHighest()],
  ['on-surface', roles.onSurface()],
  ['on-surface-variant', roles.onSurfaceVariant()],
  ['outline', roles.outline()],
  ['outline-variant', roles.outlineVariant()],
  ['primary', roles.primary()],
  ['on-primary', roles.onPrimary()],
  ['primary-container', roles.primaryContainer()],
  ['on-primary-container', roles.onPrimaryContainer()],
  ['scrim', roles.scrim()],
] as const;

// A var by a key computed at run time, which the group's literal key types do not admit.
const roleOf = (key: string): string =>
  String(Object.entries(color).find(([name]) => name === key)?.[1]);

type Rgb = readonly [number, number, number];

const rgbOf = (hex: string): Rgb => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];

// WCAG 2.x relative luminance and contrast ratio.
const channel = (value: number): number => {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: Rgb): number =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const contrast = (a: Rgb, b: Rgb): number => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (Number(light) + 0.05) / (Number(dark) + 0.05);
};

// A color laid at `alpha` over pure white, composited in sRGB without rounding.
const overWhite = ([r, g, b]: Rgb, alpha: number): Rgb => [
  alpha * r + (1 - alpha) * 255,
  alpha * g + (1 - alpha) * 255,
  alpha * b + (1 - alpha) * 255,
];

const SURFACES = [
  'surface',
  'surface-container-lowest',
  'surface-container-low',
  'surface-container',
  'surface-container-high',
  'surface-container-highest',
];

describe('the color roles', () => {
  test.each(ROLES)('%s is the scheme’s', (name, role) => {
    expect(roleOf(name)).toBe(hexFromArgb(role.getArgb(scheme)));
  });

  test('hold the listed roles and no others', () => {
    expect(Object.keys(color)).toEqual(ROLES.map(([name]) => name));
  });
});

describe('contrast', () => {
  test.each(['on-surface', 'on-surface-variant'])(
    '%s reads at 4.5:1 or more on the surface and every container',
    (text) => {
      for (const ground of SURFACES) {
        expect(contrast(rgbOf(roleOf(text)), rgbOf(roleOf(ground)))).toBeGreaterThanOrEqual(4.5);
      }
    },
  );

  test('on-primary-container reads at 4.5:1 or more on primary-container', () => {
    expect(
      contrast(rgbOf(color['on-primary-container']), rgbOf(color['primary-container'])),
    ).toBeGreaterThanOrEqual(4.5);
  });

  test('outline reaches 3:1 on the surface (WCAG 1.4.11)', () => {
    expect(contrast(rgbOf(color.outline), rgbOf(color.surface))).toBeGreaterThanOrEqual(3);
  });
});

describe('the brand colors', () => {
  test('set the logo’s letters in on-surface’s value', () => {
    expect(brand['logo-type']).toBe(color['on-surface']);
  });

  test('set its period in the primary source itself, not a scheme tone', () => {
    expect(brand['logo-mark']).toBe(hexFromArgb(PRIMARY_SOURCE.toInt()));
    expect(Object.values(color)).not.toContain(brand['logo-mark']);
  });
});

describe('the focus ring', () => {
  test('is primary, offset by its own width', () => {
    expect(focus.color).toBe(color.primary);
    expect(focus.width).toBe('2px');
    expect(focus.offset).toBe(focus.width);
  });

  test('reads at 10.9:1 on the surface it sits on', () => {
    expect(contrast(rgbOf(focus.color), rgbOf(color.surface))).toBeCloseTo(10.94, 2);
  });
});

// CIELAB L* from relative luminance, the tone Material 3's color space keeps.
const lstar = (rgb: Rgb): number => {
  const y = luminance(rgb);
  const f = y > 216 / 24389 ? Math.cbrt(y) : ((24389 / 27) * y + 16) / 116;
  return 116 * f - 16;
};

describe('the chrome', () => {
  const ALPHA = 0.858;
  const LIGHTEST_SURFACE = roles.surfaceContainerHighest().getTone(scheme);
  const toneAt = (alpha: number): number => lstar(overWhite(rgbOf(color.surface), alpha));
  const texts = ['on-surface', 'on-surface-variant', 'primary'];

  test('fills with the surface at its alpha', () => {
    const [r, g, b] = rgbOf(color.surface);
    expect(chrome.fill).toBe(`rgba(${r}, ${g}, ${b}, ${ALPHA})`);
  });

  test('stays no lighter than the lightest surface over white, and not a thousandth below', () => {
    expect(LIGHTEST_SURFACE).toBe(22);
    expect(toneAt(ALPHA)).toBeLessThanOrEqual(LIGHTEST_SURFACE);
    expect(toneAt(ALPHA - 0.001)).toBeGreaterThan(LIGHTEST_SURFACE);
  });

  test('keeps every bar text at 4.5:1 over white as a consequence', () => {
    for (const text of texts) {
      expect(
        contrast(rgbOf(roleOf(text)), overWhite(rgbOf(color.surface), ALPHA)),
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('blurs by space m, unsaturated', () => {
    expect(chrome.blur).toBe(`blur(${space.m})`);
  });

  test('ends in a 1px outline-variant rule', () => {
    expect(chrome['rule-color']).toBe(color['outline-variant']);
    expect(chrome['rule-width']).toBe('1px');
  });
});

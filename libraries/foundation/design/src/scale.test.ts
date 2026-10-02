import { describe, expect, test, vi } from 'vite-plus/test';

import { grid, layout, leading, space, tableRow, type } from './scale.stylex';

// Unbuilt, `defineVars` hands back its own argument, so each var reads as the value the StyleX
// compiler evaluates for it.
vi.mock('@stylexjs/stylex', () => ({ defineVars: <Vars>(vars: Vars): Vars => vars }));

// The axioms, restated: a change on either side fails here until both agree.
const VIEWPORT = { min: 320, max: 1280 };
const STEP_0 = { min: 16, max: 20 };
const RATIO = { min: 6 / 5, max: 5 / 4 };
const BODY_LINE_HEIGHT = 1.5;
const HEADER_HEIGHT_REM = 4;
const TOUCH_TARGET_REM = 3;
const ICON_REM = 1.5;
// Utopia's rule of thumb for text to pass 200% zoom (WCAG 1.4.4); WCAG itself states no ratio.
const MAX_GROWTH = 2.5;

const STEPS = [-2, -1, 0, 1, 2, 3, 4, 5];

const SPACES: ReadonlyArray<readonly [string, number]> = [
  ['3xs', 0.25],
  ['2xs', 0.5],
  ['xs', 0.75],
  ['s', 1],
  ['m', 1.5],
  ['l', 2],
  ['xl', 3],
  ['2xl', 4],
  ['3xl', 6],
];

const PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['3xs', '2xs'],
  ['2xs', 'xs'],
  ['xs', 's'],
  ['s', 'm'],
  ['m', 'l'],
  ['l', 'xl'],
  ['xl', '2xl'],
  ['2xl', '3xl'],
  ['s', 'l'],
];

const multiplier = (name: string): number => {
  const entry = SPACES.find(([key]) => key === name);
  if (entry === undefined) throw new Error(`no space ${name}`);
  return entry[1];
};

const to4 = (value: number): number => Math.round(value * 10000) / 10000;

// Utopia: slope = Δpx / Δvw, intercept = minPx − slope × minVw, clamped at both ends, in rem + vw.
const clamp = (minPx: number, maxPx: number): string => {
  const slope = (maxPx - minPx) / (VIEWPORT.max - VIEWPORT.min);
  const intercept = minPx - slope * VIEWPORT.min;
  return `clamp(${to4(minPx / 16)}rem, ${to4(intercept / 16)}rem + ${to4(slope * 100)}vw, ${to4(maxPx / 16)}rem)`;
};

// A var by a key computed at run time, which the groups' literal key types do not admit.
const varOf = (group: object, key: string): unknown =>
  Object.entries(group).find(([name]) => name === key)?.[1];

describe('the type scale', () => {
  test.each(STEPS)('step %i is step 0 times the ratio to that power, at each end', (n) => {
    expect(varOf(type, `step-${n}`)).toBe(
      clamp(STEP_0.min * RATIO.min ** n, STEP_0.max * RATIO.max ** n),
    );
  });

  test('holds no step outside −2 to +5', () => {
    expect(Object.keys(type)).toHaveLength(STEPS.length);
  });
});

describe('leading', () => {
  // Both terms are linear between the same two viewports, so a sum that holds at both ends holds
  // at every width between.
  test.each(STEPS)('step %i is its type step plus space 2xs, at each end', (n) => {
    const gap = multiplier('2xs');
    expect(varOf(leading, `step-${n}`)).toBe(
      clamp(
        STEP_0.min * RATIO.min ** n + STEP_0.min * gap,
        STEP_0.max * RATIO.max ** n + STEP_0.max * gap,
      ),
    );
  });

  test('sets step 0 at the body line height at both ends', () => {
    const gap = multiplier('2xs');
    expect((STEP_0.min + STEP_0.min * gap) / STEP_0.min).toBe(BODY_LINE_HEIGHT);
    expect((STEP_0.max + STEP_0.max * gap) / STEP_0.max).toBe(BODY_LINE_HEIGHT);
  });

  test('holds a line height for every type step and nothing else', () => {
    expect(Object.keys(leading)).toEqual(Object.keys(type));
  });
});

describe('the space scale', () => {
  test.each(SPACES)('%s is step 0 times %d, at each end', (name, factor) => {
    expect(varOf(space, name)).toBe(clamp(STEP_0.min * factor, STEP_0.max * factor));
  });

  test.each(PAIRS)('%s-%s runs from the first’s minimum to the second’s maximum', (from, to) => {
    expect(varOf(space, `${from}-${to}`)).toBe(
      clamp(STEP_0.min * multiplier(from), STEP_0.max * multiplier(to)),
    );
  });

  test('holds the single steps and the pairs, nothing else', () => {
    expect(Object.keys(space)).toHaveLength(SPACES.length + PAIRS.length);
  });
});

describe('the grid', () => {
  test('is twelve columns, its gutter and gap the s-l pair', () => {
    expect(grid.columns).toBe('12');
    expect(grid.gutter).toBe(space['s-l']);
    expect(grid.gap).toBe(space['s-l']);
  });

  test('its container is as wide as the widest viewport, leaving 1200px of content', () => {
    expect(grid['max-width']).toBe(`${VIEWPORT.max / 16}rem`);
    expect(VIEWPORT.max - 2 * STEP_0.max * multiplier('l')).toBe(1200);
  });
});

describe('the layout measures', () => {
  test('are the fixed axioms', () => {
    expect(layout).toMatchObject({
      measure: '66ch',
      'header-height': `${HEADER_HEIGHT_REM}rem`,
      'touch-target': `${TOUCH_TARGET_REM}rem`,
      icon: `${ICON_REM}rem`,
    });
  });

  test('pad the header by half its height less a touch target, fixed', () => {
    expect(layout['header-padding-block']).toBe(`${(HEADER_HEIGHT_REM - TOUCH_TARGET_REM) / 2}rem`);
    expect(layout['header-padding-block']).toBe('0.5rem');
  });
});

describe('table rows', () => {
  test('pad their block by space xs', () => {
    expect(tableRow['padding-block']).toBe(space.xs);
  });

  test('stand exactly space xl with step 0 text: 48px at the narrowest viewport, 60px at the widest', () => {
    const xs = multiplier('xs');
    const xl = multiplier('xl');
    expect(STEP_0.min * BODY_LINE_HEIGHT + 2 * STEP_0.min * xs).toBe(STEP_0.min * xl);
    expect(STEP_0.max * BODY_LINE_HEIGHT + 2 * STEP_0.max * xs).toBe(STEP_0.max * xl);
    expect([STEP_0.min * xl, STEP_0.max * xl]).toEqual([48, 60]);
  });
});

describe('every type step', () => {
  const steps = Object.values(type).map(String);

  test.each(steps)('%s grows at most 2.5× from its minimum to its maximum', (value) => {
    const ends = /^clamp\(([\d.]+)rem, .+, ([\d.]+)rem\)$/.exec(value);
    if (ends === null) throw new Error(`not a clamp: ${value}`);
    expect(Number(ends[2]) / Number(ends[1])).toBeLessThanOrEqual(MAX_GROWTH);
  });
});

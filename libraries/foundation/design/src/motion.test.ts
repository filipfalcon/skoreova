import { describe, expect, test, vi } from 'vite-plus/test';

import { duration, easing } from './motion.stylex';

// Unbuilt, `defineVars` hands back its own argument, so each var reads as the value the StyleX
// compiler evaluates for it.
vi.mock('@stylexjs/stylex', () => ({ defineVars: <Vars>(vars: Vars): Vars => vars }));

// Material 3's baseline tables, restated: a change on either side fails here until both agree.
const M3_DURATIONS: Record<string, number> = {
  short1: 50,
  short2: 100,
  short3: 150,
  short4: 200,
  medium1: 250,
  medium2: 300,
  medium3: 350,
  medium4: 400,
  long1: 450,
  long2: 500,
  long3: 550,
  long4: 600,
  'extra-long1': 700,
  'extra-long2': 800,
  'extra-long3': 900,
  'extra-long4': 1000,
};

const M3_EASINGS: Record<string, readonly [number, number, number, number]> = {
  standard: [0.2, 0, 0, 1],
  'standard-decelerate': [0, 0, 0, 1],
  'standard-accelerate': [0.3, 0, 1, 1],
  'emphasized-decelerate': [0.05, 0.7, 0.1, 1],
  'emphasized-accelerate': [0.3, 0, 0.8, 0.15],
  legacy: [0.4, 0, 0.2, 1],
  linear: [0, 0, 1, 1],
};

describe('the durations', () => {
  test('are Material 3’s, in milliseconds', () => {
    expect(duration).toEqual(
      Object.fromEntries(Object.entries(M3_DURATIONS).map(([name, ms]) => [name, `${ms}ms`])),
    );
  });
});

describe('the easings', () => {
  test('are Material 3’s curves', () => {
    expect(easing).toEqual(
      Object.fromEntries(
        Object.entries(M3_EASINGS).map(([name, points]) => [
          name,
          `cubic-bezier(${points.join(', ')})`,
        ]),
      ),
    );
  });
});

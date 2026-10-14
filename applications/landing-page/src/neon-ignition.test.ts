import { expect, test } from 'vite-plus/test';

import { LATE_WORD_ON, NON_FLASH_DIP, type NeonStep, POWER_ON } from './neon-ignition';

// WCAG 2.3.1 Three Flashes or Below Threshold (level A): no more than three flashes in any one
// second. A flash is a pair of opposing changes in relative luminance of 10% or more where the
// darker state is below 0.8, so at most six such transitions in any 1000ms window. The sign is one
// 10° field, so its two segments count together.
const MAX_DEEP_TRANSITIONS = 6;
const WINDOW_MS = 1000;
const MIN_DELTA = 0.1;
const DARK_BELOW = 0.8;
// The lit tube's relative luminance, and the darkest ground it lights over: the headline's scrim
// over a black photo.
const L_TUBE = 1;
const L_GROUND = 0.036;

const luminanceAt = (opacity: number): number => L_GROUND + opacity * (L_TUBE - L_GROUND);

// The times of a segment's deep transitions, from dark, where scripting holds the sign before it
// ignites.
const deepTransitions = (steps: ReadonlyArray<NeonStep>): ReadonlyArray<number> => {
  const times: Array<number> = [];
  let previous = luminanceAt(0);
  for (const [at, opacity] of steps) {
    const next = luminanceAt(opacity);
    if (Math.abs(next - previous) >= MIN_DELTA && Math.min(next, previous) < DARK_BELOW) {
      times.push(at);
    }
    previous = next;
  }
  return times;
};

// The most transitions any window of the given length holds; a busiest window starts at one.
const busiestWindow = (times: ReadonlyArray<number>): number =>
  Math.max(
    0,
    ...times.map((start) => times.filter((t) => t >= start && t < start + WINDOW_MS).length),
  );

test('a shallow dip changes the luminance by less than a flash', () => {
  expect(luminanceAt(1) - luminanceAt(NON_FLASH_DIP)).toBeLessThan(MIN_DELTA);
});

test('the sign ignites in no more than three flashes in any second', () => {
  const times = [...deepTransitions(POWER_ON), ...deepTransitions(LATE_WORD_ON)].sort(
    (a, b) => a - b,
  );
  expect(times.length).toBeGreaterThan(0);
  expect(busiestWindow(times)).toBeLessThanOrEqual(MAX_DEEP_TRANSITIONS);
});

test('every segment ends lit', () => {
  for (const steps of [POWER_ON, LATE_WORD_ON]) expect(steps.at(-1)?.[1]).toBe(1);
});

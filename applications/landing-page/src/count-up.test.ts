import { expect, test } from 'vite-plus/test';

import { countPeak, formatCount, parseCount } from './motion';
import { honors, starStats, unstoppableProof } from './data';

// WHAT ESCAPED EVERY PREVIOUS PASS. The count-up read a display string with
// `(\d+)` — the FIRST run of digits — and treated everything after it as an
// inert suffix. At rest that is invisible: "1.51" parsed as the integer 1 plus
// the literal text ".51" reassembles into "1.51" the moment the animation
// settles, so the section looks right in every screenshot and every DOM
// assertion. The defect only exists between the first frame and the last, and
// reveals replay, so it played on every scroll-by: the per-90 tile opened on
// "0.51" and spun up through "6.51", and the EURO attendance figure counted
// its leading group alone, opening on "0,291" and passing "736,291" — a crowd
// half again larger than the world record two tiles down.
//
// So these tests assert the parsed NUMBER, not the rendered string. A round
// trip cannot tell the two parsers apart; the value can.

test('a display string parses to the number it denotes, not its first digit run', () => {
  const cases: ReadonlyArray<readonly [string, number]> = [
    ['17', 17],
    ['1015', 1015],
    // The two that were wrong: 1 and 657 before this.
    ['1.51', 1.51],
    ['657,291', 657291],
    ['91,648', 91648],
    ['22×', 22],
  ];

  for (const [text, value] of cases) {
    expect(parseCount(text)?.value, text).toBe(value);
  }
});

// The general form of the same defect: whatever the parser leaves in the
// suffix is text it will NOT animate. Digits stranded there are digits the
// reader watches sit still while the ones beside them spin.
// Every string the landing page actually counts.
const countValues: ReadonlyArray<string> = [
  ...starStats.map((stat) => stat.value),
  ...honors.map((honor) => honor.count),
  // `countup: false` values take the scramble path instead — "€1B" has one
  // significant digit and is deliberately not counted.
  ...unstoppableProof.filter((stat) => stat.countup !== false).map((stat) => stat.value),
];

test('no count-up value leaves digits outside the number', () => {
  for (const value of countValues) {
    const shape = parseCount(value);
    expect(shape, `${value} does not parse as a number at all`).toBeDefined();
    if (!shape) continue;
    expect(/\d/.test(shape.suffix), `${value} strands "${shape.suffix}" outside the count`).toBe(
      false,
    );
  }
});

// The OTHER half of the same defect, and the half the parser fix left standing:
// the reach past the target scaled with the number and was never capped, so the
// attendance total — parsed correctly now — still flew to 736,166, half again
// the world record printed two tiles below it. A reader cannot tell an
// exaggerated frame from a claim at that size; they can at 658,291, where only
// the low digits move.
test('a count flies past its target boldly, but never into a different number', () => {
  const cases: ReadonlyArray<readonly [string, number]> = [
    // The two the cap exists for. Uncapped these were 736,166 and 102,645.
    ['657,291', 658291],
    ['91,648', 92648],
    // …and everything smaller keeps the reach it was tuned with: 12% of the
    // number, or the bold floor of five when 12% is smaller than that.
    ['1015', 1137],
    ['17', 22],
    ['1.51', 1.69],
    ['22×', 27],
  ];

  for (const [text, peak] of cases) {
    const shape = parseCount(text);
    expect(shape, text).toBeDefined();
    if (!shape) continue;
    // Rounded because a hundredths quantum lands on binary fractions.
    expect(Math.round(countPeak(shape, 0, shape.value) * 100) / 100, text).toBe(peak);
  }
});

test('no authored count can peak more than a thousand of its own units high', () => {
  for (const value of countValues) {
    const shape = parseCount(value);
    expect(shape, `${value} does not parse as a number at all`).toBeDefined();
    if (!shape) continue;
    // A count that recounts to the same value winds UP from its resting number,
    // so `from` and `target` both matter — the cap has to hold either way.
    const reach = countPeak(shape, shape.value, shape.value) - shape.value;
    expect(reach, `${value} overshoots by ${reach}`).toBeLessThanOrEqual(
      1000 * 10 ** -shape.decimals,
    );
  }
});

// Intermediate frames have to be written the way the resting value is, or the
// number changes shape as it moves — "657291" mid-flight snapping to
// "657,291" at the end, or a rate losing its second decimal place.
test('every frame of a count keeps the resting formatting', () => {
  const rate = parseCount('1.51');
  expect(rate && formatCount(rate, 0.87)).toBe('0.87');
  expect(rate && formatCount(rate, 1.5)).toBe('1.50');

  const crowd = parseCount('657,291');
  expect(crowd && formatCount(crowd, 412000)).toBe('412,000');

  // …and a plain integer stays plain: "1015 minutes" is not "1,015".
  const minutes = parseCount('1015');
  expect(minutes && formatCount(minutes, 640)).toBe('640');
});

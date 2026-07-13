import { page } from 'vitest/browser';
import { Runtime } from 'foldkit';
import { afterAll, beforeAll, expect, test } from 'vitest';

import { ChangedUrl, ClickedLink, Model, init, update, view } from './main';
import './styles.css';

// Geometric guard for the map's pin system: measures the real rendered
// geometry (chips, dots, connector lines) and fails on ANY touching pair —
// on the phone viewport and on desktop. The phone layout lives on
// hand-tuned constants (PIN_ANCHOR_PHONE / PIN_ANGLE_PHONE in main.ts);
// whenever those or the club coordinates change, this is what proves the
// map stayed clean. Also guards that the phone draw-in actually animates
// progressively (it must not pop in fully drawn).

const waitUntil = async (predicate: () => boolean, timeout = 10000): Promise<void> => {
  const start = performance.now();
  while (!predicate()) {
    if (performance.now() - start > timeout) throw new Error('waitUntil timed out');
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
};

interface Point {
  readonly x: number;
  readonly y: number;
}

interface PinGeometry {
  readonly label: string;
  readonly dot: Point;
  readonly end: Point;
  readonly chipCenter: Point;
  readonly chipRadius: number;
}

const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

const pointToSegment = (p: Point, a: Point, b: Point): number => {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lengthSquared = abx * abx + aby * aby;
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / lengthSquared));
  return distance(p, { x: a.x + t * abx, y: a.y + t * aby });
};

const segmentsIntersect = (a: Point, b: Point, c: Point, d: Point): boolean => {
  const cross = (o: Point, p: Point, q: Point): number =>
    (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x);
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
};

const segmentToSegment = (a: Point, b: Point, c: Point, d: Point): number => {
  if (segmentsIntersect(a, b, c, d)) return 0;
  return Math.min(
    pointToSegment(a, c, d),
    pointToSegment(b, c, d),
    pointToSegment(c, a, b),
    pointToSegment(d, a, b),
  );
};

// The pins REVEAL through an inner wrapper (the root keeps its z-index
// transition; see clubPin in main.ts): until it intersects the viewport
// the wrapper holds its entrance offset (translateY), so measuring at an
// arbitrary scroll position compares settled pins against still-offset
// ones and reports phantom overlaps. Center the map, wait for every pin's
// reveal, then wait for the geometry itself to stop moving (`.is-in`
// lands when the observer fires, while the transform is still in flight).
const settleMap = async (): Promise<void> => {
  const stage = document.querySelector('.map-stage');
  if (!stage) throw new Error('map stage missing');
  stage.scrollIntoView({ block: 'center', behavior: 'instant' });
  const revealWrappers = (): ReadonlyArray<HTMLElement> =>
    Array.from(document.querySelectorAll<HTMLElement>('.club-pin > [data-reveal]'));
  await waitUntil(() => revealWrappers().every((wrapper) => wrapper.classList.contains('is-in')));
  // A position-stability check is NOT enough: reveals carry per-land
  // delays (up to ~2s), and a pin parked at its entrance offset waiting
  // for its delay reads as "stable". The entrance offset lives only in
  // the `:not(.is-in)` rule, so a truly settled wrapper computes BOTH
  // transform and translate as `none` — mid-flight or parked ones don't.
  await waitUntil(() =>
    revealWrappers().every((wrapper) => {
      const style = getComputedStyle(wrapper);
      return style.transform === 'none' && style.translate === 'none';
    }),
  );
};

const collectPins = (): ReadonlyArray<PinGeometry> =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('.club-pin')).map((button) => {
    const rect = button.getBoundingClientRect();
    const dot = { x: rect.left, y: rect.top };
    const style = getComputedStyle(button);
    const fanScale = Number.parseFloat(style.getPropertyValue('--fan-scale')) || 1;
    // --fx/--fy are the breakpoint-effective fan vars (phone override or base).
    const fanX = Number.parseFloat(style.getPropertyValue('--fx')) * 16 * fanScale;
    const fanY = Number.parseFloat(style.getPropertyValue('--fy')) * 16 * fanScale;
    const end = { x: dot.x + fanX, y: dot.y - fanY };
    const chip = button.querySelector('img')?.parentElement;
    if (!chip) throw new Error('chip missing');
    const chipRect = chip.getBoundingClientRect();
    return {
      label: button.querySelector('button')?.getAttribute('aria-label') ?? 'pin',
      dot,
      end,
      chipCenter: {
        x: chipRect.left + chipRect.width / 2,
        y: chipRect.top + chipRect.height / 2,
      },
      chipRadius: chipRect.width / 2,
    };
  });

beforeAll(async () => {
  await page.viewport(390, 844);
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);
  Runtime.run(
    Runtime.makeApplication({
      Model,
      init,
      update,
      view,
      container: root,
      routing: {
        onUrlRequest: (request) => ClickedLink({ request }),
        onUrlChange: (url) => ChangedUrl({ url }),
      },
    }),
  );
  await waitUntil(() => document.querySelectorAll('.club-pin').length > 0);
});

// The viewport is PAGE state shared across test files in the same browser
// run — leave it as we found it, or whichever file runs next inherits a
// phone/desktop layout it never asked for (the knight-mascot hit test
// failed exactly this way). 414×896 is the runner's default.
afterAll(async () => {
  await page.viewport(414, 896);
});

test('draw-in animates progressively on a phone viewport', async () => {
  const svg = document.querySelector<SVGSVGElement>("svg[data-reveal='draw']");
  if (!svg) throw new Error('svg missing');
  const path = document.querySelector('.map-path');
  if (!path) throw new Error('map path missing');

  const section = document.querySelector<HTMLElement>('#across-the-lands');
  if (!section) throw new Error('clubs section missing');

  // WARM-UP lap first: on a cold WebKit the first reveal lands while the
  // page is still compiling — one long freeze swallows the whole 0.7s
  // transition between two samples and the test sees only 1 → 0. The map
  // is a replay reveal group, so scroll it in (spending the cold jank),
  // away (resetting the dash), and back in to measure on a warm page.
  window.scrollTo({ top: section.offsetTop - 80, behavior: 'instant' });
  await waitUntil(() => svg.classList.contains('is-in'));
  window.scrollTo({ top: 0, behavior: 'instant' });
  await waitUntil(() => !svg.classList.contains('is-in'));
  window.scrollTo({ top: section.offsetTop - 80, behavior: 'instant' });
  await waitUntil(() => svg.classList.contains('is-in'));

  // Sample the offset for a second — a progressive draw must show
  // intermediate values, an instant one jumps straight to 0.
  const samples: Array<number> = [];
  const start = performance.now();
  while (performance.now() - start < 1200) {
    samples.push(Number.parseFloat(getComputedStyle(path).strokeDashoffset));
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  const intermediates = samples.filter((value) => value > 0.05 && value < 0.95);
  expect
    .soft(intermediates.length, `no intermediate offsets; samples: ${samples.join(', ')}`)
    .toBeGreaterThan(2);
});

const collectViolations = (pins: ReadonlyArray<PinGeometry>): ReadonlyArray<string> => {
  const violations: Array<string> = [];
  for (let i = 0; i < pins.length; i += 1) {
    for (let j = i + 1; j < pins.length; j += 1) {
      const a = pins[i];
      const b = pins[j];
      if (!a || !b) continue;
      const chipGap = distance(a.chipCenter, b.chipCenter) - a.chipRadius - b.chipRadius;
      if (chipGap < 2) {
        violations.push(`CHIP-CHIP ${a.label} × ${b.label}: gap ${chipGap.toFixed(1)}px`);
      }
      // A SHARED anchor (crowded-city pins collapse onto one point on
      // phones) is one clean dot with rays out of it, not a collision —
      // there the rays just need angular separation to stay distinct.
      const sharedAnchor = distance(a.dot, b.dot) < 1;
      if (sharedAnchor) {
        const angleA = Math.atan2(a.end.y - a.dot.y, a.end.x - a.dot.x);
        const angleB = Math.atan2(b.end.y - b.dot.y, b.end.x - b.dot.x);
        let spread = Math.abs(angleA - angleB) * (180 / Math.PI);
        if (spread > 180) spread = 360 - spread;
        if (spread < 20) {
          violations.push(`RAY-RAY ${a.label} × ${b.label}: spread ${spread.toFixed(0)}°`);
        }
      } else {
        const lineGap = segmentToSegment(a.dot, a.end, b.dot, b.end);
        if (lineGap < 2) {
          violations.push(`LINE-LINE ${a.label} × ${b.label}: gap ${lineGap.toFixed(1)}px`);
        }
        const dotGap = distance(a.dot, b.dot) - 6;
        if (dotGap < 2) {
          violations.push(`DOT-DOT ${a.label} × ${b.label}: gap ${dotGap.toFixed(1)}px`);
        }
      }
      const chipLineAB = pointToSegment(a.chipCenter, b.dot, b.end) - a.chipRadius;
      if (chipLineAB < 2) {
        violations.push(
          `CHIP-LINE ${a.label} chip × ${b.label} line: gap ${chipLineAB.toFixed(1)}px`,
        );
      }
      const chipLineBA = pointToSegment(b.chipCenter, a.dot, a.end) - b.chipRadius;
      if (chipLineBA < 2) {
        violations.push(
          `CHIP-LINE ${b.label} chip × ${a.label} line: gap ${chipLineBA.toFixed(1)}px`,
        );
      }
      const chipDotAB = distance(a.chipCenter, b.dot) - a.chipRadius - 3;
      if (chipDotAB < 2) {
        violations.push(`CHIP-DOT ${a.label} chip × ${b.label} dot: gap ${chipDotAB.toFixed(1)}px`);
      }
      const chipDotBA = distance(b.chipCenter, a.dot) - b.chipRadius - 3;
      if (chipDotBA < 2) {
        violations.push(`CHIP-DOT ${b.label} chip × ${a.label} dot: gap ${chipDotBA.toFixed(1)}px`);
      }
    }
  }
  return violations;
};

test('no chips, dots, or lines touch each other on a phone viewport', async () => {
  await page.viewport(390, 844);
  await settleMap();
  const pins = collectPins();
  expect(pins.length).toBeGreaterThan(10);
  expect(collectViolations(pins)).toEqual([]);
});

test('no chips, dots, or lines touch each other on desktop', async () => {
  await page.viewport(1280, 800);
  await settleMap();
  const pins = collectPins();
  expect(pins.length).toBeGreaterThan(10);
  expect(collectViolations(pins)).toEqual([]);
});

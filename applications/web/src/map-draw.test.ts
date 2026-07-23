import { Runtime } from 'foldkit';
import { beforeAll, expect, test } from 'vitest';

import { ChangedUrl, ClickedLink, Model, init, update, view } from './main';
import './styles.css';

// Guards the map's pen-stroke draw-in: after the clubs section scrolls into
// view, the country outline AND the internal land borders must finish
// drawing — computed stroke-dashoffset reaches 0 on every path. This runs on
// chromium and webkit; webkit is the engine where an IntersectionObserver on
// an inner SVG element (<g>, <path>) silently never fires, which once left
// the map completely undrawn on iPhones.

const waitUntil = async (predicate: () => boolean, timeout = 6000): Promise<void> => {
  const start = performance.now();
  while (!predicate()) {
    if (performance.now() - start > timeout) throw new Error('waitUntil timed out');
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
};

const dashOffset = (element: Element): number =>
  Number.parseFloat(getComputedStyle(element).strokeDashoffset);

beforeAll(async () => {
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

  await waitUntil(() => document.querySelector('.map-path') !== null);

  // Scroll to the map STAGE, not the section top: on phone widths the
  // section head (counters column + the scout) is taller than a viewport,
  // so the svg would never intersect from up there.
  const stage = document.querySelector<HTMLElement>('.map-stage');
  if (!stage) throw new Error('map stage not rendered');
  window.scrollTo({
    top: stage.getBoundingClientRect().top + window.scrollY - 100,
    behavior: 'instant',
  });
});

test('the outline and land borders draw in fully', async () => {
  const svg = document.querySelector<SVGSVGElement>("svg[data-reveal='draw']");
  if (!svg) throw new Error('draw-reveal svg not rendered');

  // The observer must fire for the svg root even on webkit.
  await waitUntil(() => svg.classList.contains('is-in'));

  const paths = [
    ...document.querySelectorAll('.map-path'),
    ...document.querySelectorAll('.region-path'),
  ];
  expect(paths.length).toBeGreaterThanOrEqual(4);

  // The draw transition runs 2.4s; poll until every path lands at 0.
  await waitUntil(() => paths.every((path) => dashOffset(path) === 0));
  for (const path of paths) {
    expect(dashOffset(path)).toBe(0);
  }
});

test('the draw survives a model re-render mid-flight', async () => {
  const svg = document.querySelector<SVGSVGElement>("svg[data-reveal='draw']");
  if (!svg) throw new Error('draw-reveal svg not rendered');

  // Flip the league filter there and back — this re-renders the map subtree
  // (pin wrappers toggle) while the reveal classes live imperatively on the
  // svg. The borders must stay fully drawn afterwards. (This used to toggle
  // a land checkbox; the region-toggle mechanism was removed.)
  const chip = (label: string): HTMLElement => {
    const found = [
      ...document.querySelectorAll<HTMLElement>('#across-the-lands [role="radio"]'),
    ].find((candidate) => candidate.textContent?.trim() === label);
    if (!found) throw new Error(`${label} chip not rendered`);
    return found;
  };
  // The league filter is a radiogroup now; selection shows through
  // aria-checked, not a class (the active color is a static data-[checked]
  // variant that is always present in the class string).
  chip('First League').click();
  await waitUntil(() => chip('First League').getAttribute('aria-checked') === 'true');
  chip('All clubs').click();
  await waitUntil(() => chip('All clubs').getAttribute('aria-checked') === 'true');

  await new Promise((resolve) => setTimeout(resolve, 400));
  expect(svg.classList.contains('is-in')).toBe(true);
  const paths = [
    ...document.querySelectorAll('.map-path'),
    ...document.querySelectorAll('.region-path'),
  ];
  await waitUntil(() => paths.every((path) => dashOffset(path) === 0));
});

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

  const section = document.querySelector<HTMLElement>('#across-the-lands');
  if (!section) throw new Error('clubs section not rendered');
  window.scrollTo({ top: section.offsetTop - 100, behavior: 'instant' });
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

  // Toggle a region off and on — this re-renders the map subtree while the
  // reveal classes live imperatively on the svg. The borders must stay
  // fully drawn afterwards.
  const counter = document.querySelector<HTMLElement>("[aria-label='Hide Moravia on the map']");
  if (!counter) throw new Error('Moravia counter not rendered');
  counter.click();
  await waitUntil(() => document.querySelector("[aria-label='Show Moravia on the map']") !== null);
  document.querySelector<HTMLElement>("[aria-label='Show Moravia on the map']")?.click();

  await new Promise((resolve) => setTimeout(resolve, 400));
  expect(svg.classList.contains('is-in')).toBe(true);
  const paths = [
    ...document.querySelectorAll('.map-path'),
    ...document.querySelectorAll('.region-path'),
  ];
  await waitUntil(() => paths.every((path) => dashOffset(path) === 0));
});

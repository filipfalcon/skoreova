import { Runtime } from 'foldkit';
import { beforeAll, expect, test } from 'vite-plus/test';

import { Model, init, routing, update, view } from '../main';
import '../styles.css';
import { HEADLINE_WIDEST_EM } from './hero';

// The hero as the browser lays it out: under the bar, filling the viewport below it, its widest
// headline line filling the content column wherever the width rule holds.

const waitUntil = async (predicate: () => boolean, timeout = 3000): Promise<void> => {
  const start = performance.now();
  while (!predicate()) {
    if (performance.now() - start > timeout) throw new Error('waitUntil timed out');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
};

const element = (selector: string): HTMLElement => {
  const found = document.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`${selector} not rendered`);
  return found;
};

// Cascade layers rank in the order they first appear in the document's sheets. On the page the stylesheet, which declares StyleX's layer last, comes first; this runner injects StyleX's sheet ahead of it.
const putStylesheetFirst = (): void => {
  const declaresOrder = (sheet: CSSStyleSheet): boolean =>
    Array.from(sheet.cssRules).some(
      (rule) => rule instanceof CSSLayerStatementRule && rule.nameList.includes('stylex'),
    );
  const owner = Array.from(document.styleSheets).find(declaresOrder)?.ownerNode;
  if (!(owner instanceof HTMLStyleElement)) throw new Error('the stylesheet is not loaded');
  document.head.prepend(owner);
};

beforeAll(async () => {
  putStylesheetFirst();
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);
  Runtime.run(Runtime.makeApplication({ Model, init, update, view, container: root, routing }));
  await waitUntil(() => document.querySelector('#top h1') !== null);
});

test('starts exactly under the bar and fills the viewport below it', () => {
  const bar = element('header').getBoundingClientRect();
  const hero = element('#top').getBoundingClientRect();
  expect(hero.top).toBeCloseTo(bar.bottom, 1);
  expect(hero.height).toBeCloseTo(window.innerHeight - bar.height, 0);
});

test('fills the content column with its widest line where the width rule holds', async () => {
  const headline = element('#top h1');
  const column = headline.parentElement;
  if (!column) throw new Error('no column');
  const style = getComputedStyle(column);
  const inline =
    column.getBoundingClientRect().width -
    Number.parseFloat(style.paddingLeft) -
    Number.parseFloat(style.paddingRight);
  // At this runner's portrait viewport the width rule holds. This runner serves StyleX's rules on a timer, so they can land after the first render.
  await expect
    .poll(() => Number.parseFloat(getComputedStyle(headline).fontSize))
    .toBeCloseTo(inline / HEADLINE_WIDEST_EM, 1);
  const lines = Array.from(headline.querySelectorAll<HTMLElement>('.hero-line, .hero-neon'));
  const widest = Math.max(
    ...lines.map((line) => {
      const range = document.createRange();
      range.selectNodeContents(line);
      return range.getBoundingClientRect().width;
    }),
  );
  expect(widest).toBeCloseTo(inline, 0);
});

test('spaces its lines at 1em plus 2xs, and its CTA is 4rem tall', () => {
  const headline = element('#top h1');
  const line = element('#top .hero-line');
  const fontSize = Number.parseFloat(getComputedStyle(headline).fontSize);
  const leading = Number.parseFloat(getComputedStyle(line).lineHeight);
  // 2xs at this viewport, from the scale: 8px at 320 to 10px at 1280.
  const twoXs = 8 + (2 * (Math.min(Math.max(window.innerWidth, 320), 1280) - 320)) / 960;
  expect(leading - fontSize).toBeCloseTo(twoXs, 1);
  const cta = element('#top a[href^="https:"]');
  expect(cta.getBoundingClientRect().height).toBeCloseTo(64, 0);
});

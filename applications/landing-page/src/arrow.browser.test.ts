import { Runtime } from 'foldkit';
import { beforeAll, describe, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';

import { platformUrl } from './data';
import { Model, init, routing, subscriptions, update, view } from './main';
import { KNOCKS, KNOCK_MS, LONGEST_WAIT_MS } from './arrow';
import './styles.css';

// The platform CTAs' arrows as the browser resolves their styles: the drawn arrow's size from the
// type, and each knock's timing, its tokens and custom properties computed, against the arithmetic
// arrow.ts states for WCAG 2.2.2. This runner cannot emulate reduced motion, so the
// reduced-motion values are not asserted here.

const arrowIn = (scope: string): SVGSVGElement => {
  const element = document.querySelector<SVGSVGElement>(`${scope} a[href="${platformUrl}"] svg`);
  if (!element) throw new Error(`no platform arrow in ${scope}`);
  return element;
};

const seconds = (value: string): number => {
  if (!value.endsWith('s')) throw new Error(`not a time in seconds: ${value}`);
  return Number(value.slice(0, -1));
};

// A knock's timing, in milliseconds, as computed.
const knockOf = (arrow: SVGSVGElement) => {
  const style = getComputedStyle(arrow);
  return {
    name: style.animationName,
    delay: Math.round(seconds(style.animationDelay) * 1000),
    duration: Math.round(seconds(style.animationDuration) * 1000),
    count: Number(style.animationIterationCount),
  };
};

const pixels = (value: string): number => Number(value.replace('px', ''));

// Cascade layers rank in the order they first appear in the document's sheets. On the page the
// stylesheet, which declares StyleX's layer last, comes first; this runner injects StyleX's sheet
// ahead of it, which would rank StyleX below Tailwind's base. Put the stylesheet first, as there.
const putStylesheetFirst = (): void => {
  const declaresOrder = (sheet: CSSStyleSheet): boolean =>
    Array.from(sheet.cssRules).some(
      (rule) => rule instanceof CSSLayerStatementRule && rule.nameList.includes('stylex'),
    );
  const owner = Array.from(document.styleSheets).find(declaresOrder)?.ownerNode;
  if (!(owner instanceof HTMLStyleElement)) throw new Error('the stylesheet is not loaded');
  document.head.prepend(owner);
};

const waitUntil = async (predicate: () => boolean, timeout = 3000): Promise<void> => {
  const start = performance.now();
  while (!predicate()) {
    if (performance.now() - start > timeout) throw new Error('waitUntil timed out');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
};

beforeAll(async () => {
  putStylesheetFirst();
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);

  Runtime.run(
    Runtime.makeApplication({
      Model,
      init,
      update,
      view,
      subscriptions,
      container: root,
      routing,
    }),
  );

  await waitUntil(() => document.querySelector('#top') !== null);
});

describe('the drawn arrow', () => {
  test('stands as tall as Archivo’s capitals, a quarter of its size after the text', () => {
    const arrow = arrowIn('#top');
    const size = pixels(getComputedStyle(arrow).fontSize);
    expect(pixels(getComputedStyle(arrow).height)).toBeCloseTo(0.686 * size, 1);
    expect(pixels(getComputedStyle(arrow).marginLeft)).toBeCloseTo(0.25 * size, 1);
    expect(getComputedStyle(arrow).verticalAlign).toBe('baseline');
  });
});

describe('the knock', () => {
  test('plays a whole number of knocks, ending within 5 seconds of the longest wait', () => {
    expect(Number.isInteger(KNOCKS)).toBe(true);
    expect(KNOCKS).toBeGreaterThan(0);
    expect(LONGEST_WAIT_MS + KNOCKS * KNOCK_MS).toBeLessThanOrEqual(5000);
    expect(LONGEST_WAIT_MS + (KNOCKS + 1) * KNOCK_MS).toBeGreaterThan(5000);
  });

  test('on the hero, once its CTA has landed, and within 5 seconds of the page’s load', () => {
    const knock = knockOf(arrowIn('#top'));
    expect(knock.name).not.toBe('none');
    expect(knock).toMatchObject({ delay: 650 + 700, duration: KNOCK_MS, count: KNOCKS });
    expect(knock.delay + knock.count * knock.duration).toBeLessThanOrEqual(5000);
  });

  test('in the header, once its CTA has entered, from each showing', async () => {
    expect(knockOf(arrowIn('header')).name).toBe('none');

    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
    await expect.poll(() => knockOf(arrowIn('header')).name, { timeout: 3000 }).not.toBe('none');
    const knock = knockOf(arrowIn('header'));
    expect(knock).toMatchObject({ delay: 400, duration: KNOCK_MS, count: KNOCKS });
    expect(knock.delay).toBeLessThanOrEqual(LONGEST_WAIT_MS);

    window.scrollTo({ top: 0, behavior: 'instant' });
    await expect.poll(() => knockOf(arrowIn('header')).name, { timeout: 3000 }).toBe('none');
  });

  test('in the menu, once its Platform entry has landed, from each opening', async () => {
    expect(knockOf(arrowIn('#menu-overlay')).name).toBe('none');

    await page.getByRole('button', { name: 'Menu', exact: true, expanded: false }).click();
    await expect
      .poll(() => knockOf(arrowIn('#menu-overlay')).name, { timeout: 3000 })
      .not.toBe('none');
    const knock = knockOf(arrowIn('#menu-overlay'));
    expect(knock).toMatchObject({ delay: LONGEST_WAIT_MS, duration: KNOCK_MS, count: KNOCKS });

    await page.getByRole('button', { name: 'Menu', exact: true, expanded: true }).click();
    await expect.poll(() => knockOf(arrowIn('#menu-overlay')).name, { timeout: 3000 }).toBe('none');
  });
});

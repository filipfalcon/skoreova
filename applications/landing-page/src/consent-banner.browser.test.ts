import { Runtime } from 'foldkit';
import { beforeAll, beforeEach, expect, test } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';

import indexHtml from '../index.html?raw';
import './consent-banner.stylex';
import { ctaLink } from './cta';
import { Model, init, routing, update } from './main';
import './styles.css';

// The cookie banner's actions are static markup styled in styles.css through the literal names of
// consent-banner.stylex.ts; they stand for the small call to action of cta.ts, Accept filled and
// Decline outlined. Both are resolved here side by side, at rest and hovered, so the banner's
// copy of the values cannot drift from the component's.

const SETTING = [
  'font-family',
  'font-stretch',
  'font-weight',
  'font-size',
  'line-height',
  'letter-spacing',
  'text-transform',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'color',
  'background-color',
  'box-shadow',
] as const;

// The pointer target, which reaches out to a touch target where the box is shorter than one.
const HIT_AREA = ['top', 'bottom', 'left', 'right'] as const;

const PAIRS = [
  { action: '#cookie-consent-accept', cta: '#cta-filled', variant: 'filled' },
  { action: '#cookie-consent-decline', cta: '#cta-outlined', variant: 'outlined' },
] as const;

// Layout's unit in either engine. A box read through the banner's entrance transform carries float
// noise below it.
const LAYOUT_UNIT = 1 / 64;

const element = (selector: string): HTMLElement => {
  const found = document.querySelector<HTMLElement>(selector);
  if (found === null) throw new Error(`${selector} is not rendered`);
  return found;
};

const waitUntil = async (predicate: () => boolean, timeout: number): Promise<void> => {
  const start = performance.now();
  while (!predicate()) {
    if (performance.now() - start > timeout) throw new Error('waitUntil timed out');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
};

// Every property that must agree, with the box's height, once its state changes have run.
const resolved = async (target: HTMLElement): Promise<Record<string, string>> => {
  await Promise.all(target.getAnimations().map((animation) => animation.finished));
  const style = getComputedStyle(target);
  const before = getComputedStyle(target, '::before');
  return {
    ...Object.fromEntries(SETTING.map((property) => [property, style.getPropertyValue(property)])),
    ...Object.fromEntries(
      HIT_AREA.map((side) => [`::before ${side}`, before.getPropertyValue(side)]),
    ),
    height: `${Math.round(target.getBoundingClientRect().height / LAYOUT_UNIT) * LAYOUT_UNIT}`,
  };
};

beforeAll(async () => {
  // A spot clear of both actions and both calls to action, for the pointer to rest on: the runner's
  // page keeps the pointer wherever an earlier test file left it.
  const rest = document.createElement('div');
  rest.id = 'pointer-rest';
  rest.style.cssText =
    'position: fixed; z-index: 2147483647; right: 8px; bottom: 8px; width: 16px; height: 16px;';
  document.body.append(rest);

  const banner = new DOMParser()
    .parseFromString(indexHtml, 'text/html')
    .getElementById('cookie-consent');
  if (banner === null) throw new Error('index.html holds no cookie banner');
  banner.hidden = false;
  document.body.append(document.adoptNode(banner));

  const root = document.createElement('div');
  root.id = 'root';
  document.body.append(root);
  Runtime.run(
    Runtime.makeApplication({
      Model,
      init,
      update,
      view: (_model, h) => ({
        title: 'Call to action',
        body: h.div(
          [],
          [
            ctaLink(h, { href: '#', size: 'small', attributes: [h.Id('cta-filled')] }, ['Accept']),
            ctaLink(
              h,
              { href: '#', size: 'small', variant: 'outlined', attributes: [h.Id('cta-outlined')] },
              ['Decline'],
            ),
          ],
        ),
      }),
      container: root,
      routing,
    }),
  );
  // The app renders on its first frame, and StyleX serves its rules on a timer; the CTA is
  // inline-flex once they apply.
  await waitUntil(() => {
    const cta = document.querySelector('#cta-outlined');
    return cta !== null && getComputedStyle(cta).display === 'inline-flex';
  }, 10000);
});

beforeEach(async () => {
  await userEvent.hover(element('#pointer-rest'));
});

test.each(PAIRS)('$action matches the small $variant call to action at rest', async (pair) => {
  expect(await resolved(element(pair.action))).toEqual(await resolved(element(pair.cta)));
});

test.each(PAIRS)('$action matches the small $variant call to action hovered', async (pair) => {
  await userEvent.hover(element(pair.cta));
  const cta = await resolved(element(pair.cta));
  await userEvent.hover(element(pair.action));
  const action = await resolved(element(pair.action));
  expect(action).toEqual(cta);
});

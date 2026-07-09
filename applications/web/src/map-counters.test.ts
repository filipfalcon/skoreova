import { Runtime } from 'foldkit';
import { beforeAll, expect, test } from 'vitest';

import { ChangedUrl, ClickedLink, Model, init, update, view } from './main';
import './styles.css';

// The land counters above the map must REACT to the league filter — and
// keep reacting after the count-up animation has touched their text nodes
// (a textContent assignment there once replaced the node Foldkit patches,
// silently freezing the numbers).

const waitUntil = async (predicate: () => boolean, timeout = 8000): Promise<void> => {
  const start = performance.now();
  while (!predicate()) {
    if (performance.now() - start > timeout) throw new Error('waitUntil timed out');
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
};

const counterValues = (): ReadonlyArray<string> =>
  Array.from(document.querySelectorAll('#clubs [data-countup]'), (node) => node.textContent ?? '');

// Generous timeouts throughout: on a cold cache the whole suite's browser
// pages compile and import at once, and a starved page can spend seconds
// just reaching the first frame of a 700ms animation.
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
  await waitUntil(() => document.querySelector('#clubs') !== null);

  const section = document.querySelector<HTMLElement>('#clubs');
  if (!section) throw new Error('clubs section missing');
  window.scrollTo({ top: section.offsetTop - 80, behavior: 'instant' });
  // Let the reveal fire and the count-up animation fully land (1.4s + delays).
  await waitUntil(() => counterValues().join(',') === '11,4,1', 20000);
}, 40000);

// DOM-level clicks on purpose: the chips sit under the fixed header once
// Playwright auto-scrolls them to the viewport top, so locator clicks get
// intercepted and silently retried into oblivion.
const clickChip = (label: string): void => {
  const chip = Array.from(document.querySelectorAll<HTMLButtonElement>('#clubs button')).find(
    (button) => button.textContent === label,
  );
  if (!chip) throw new Error(`chip ${label} not found`);
  chip.click();
};

test('league filter drives the land counters', async () => {
  clickChip('Second League');
  await expect.poll(() => counterValues().join(','), { timeout: 10000 }).toBe('9,2,0');

  clickChip('First League');
  await expect.poll(() => counterValues().join(','), { timeout: 10000 }).toBe('5,2,1');

  clickChip('All clubs');
  await expect.poll(() => counterValues().join(','), { timeout: 10000 }).toBe('11,4,1');
}, 40000);

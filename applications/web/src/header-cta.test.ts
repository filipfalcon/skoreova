import { Runtime } from 'foldkit';
import { beforeAll, expect, test } from 'vitest';

import { ChangedUrl, ClickedLink, Model, init, update, view } from './main';
import './styles.css';

// Regression test for the header "Enter platform" CTA: it must stay hidden
// while the hero (which carries the primary CTA) is on screen, slide in once
// the hero disappears under the fixed header, and hide again on the way back
// up. The sync runs inside motion.ts's rAF loop and resolves the header node
// lazily — a mount-time snapshot pinned `null` forever whenever the header
// wasn't in the DOM yet (it lives outside the mount root), so the button
// never appeared. Asserted via the `is-visible` class rather than computed
// display: the CTA is desktop-only, the class is the behavioral contract.

const headerCta = (): HTMLElement => {
  const element = document.querySelector<HTMLElement>('.header-cta');
  if (!element) throw new Error('header CTA not rendered');
  return element;
};

const ctaVisible = (): boolean => headerCta().classList.contains('is-visible');

const waitUntil = async (predicate: () => boolean, timeout = 3000): Promise<void> => {
  const start = performance.now();
  while (!predicate()) {
    if (performance.now() - start > timeout) throw new Error('waitUntil timed out');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
};

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

  await waitUntil(
    () => document.querySelector('.header-cta') !== null && document.querySelector('#top') !== null,
  );
});

test('the CTA stays hidden while the hero is on screen', async () => {
  window.scrollTo({ top: 0, behavior: 'instant' });
  // Asserting a negative: give the rAF sync a few frames to (not) act.
  await new Promise((resolve) => setTimeout(resolve, 200));
  expect(ctaVisible()).toBe(false);
});

test('the CTA appears once the hero scrolls away and hides again on return', async () => {
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
  await expect.poll(ctaVisible, { timeout: 3000 }).toBe(true);

  window.scrollTo({ top: 0, behavior: 'instant' });
  await expect.poll(ctaVisible, { timeout: 3000 }).toBe(false);
});

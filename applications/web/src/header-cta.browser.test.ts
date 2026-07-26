import { Effect } from 'effect';
import { Runtime } from 'foldkit';
import { beforeAll, expect, test } from 'vite-plus/test';

import { ChangedUrl, ClickedLink, Flags, Model, init, update, view } from './main';
import './styles.css';

// Regression test for the header "Enter platform" CTA: it must stay hidden
// while the hero (which carries the primary CTA) is on screen, slide in once
// the hero disappears under the fixed header, and hide again on the way back
// up. The contract under test is the whole round trip — the hero observer
// (ObserveHeroPastHeader) reporting into `model.heroPastHeader`, and the
// header view rendering `is-visible` from it. That is what a real scroll
// exercises and what the earlier rAF-loop version got wrong twice over: it
// re-asserted the class every frame against the vdom, and its mount-time
// header lookup pinned `null` whenever the header wasn’t in the DOM yet.
// Asserted on BOTH halves of the contract: `is-visible` (what the view
// renders from the Model) and the computed `visibility` the class resolves to.
// The class alone was not enough — the hidden state’s job is to keep the link
// out of the tab order and out of the accessibility tree, and only a real
// `visibility: hidden` does that. Opacity and pointer-events, which is what
// this used to be, left an invisible focusable link on the hero. `display` is
// deliberately NOT asserted: the CTA is desktop-only, so it is `none` at any
// viewport the runner happens to use.

const headerCta = (): HTMLElement => {
  const element = document.querySelector<HTMLElement>('.header-cta');
  if (!element) throw new Error('header CTA not rendered');
  return element;
};

const ctaVisible = (): boolean => headerCta().classList.contains('is-visible');

const ctaComputedVisibility = (): string => getComputedStyle(headerCta()).visibility;

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
      Flags,
      // Deterministic: the guards exercise the full motion path.
      flags: Effect.sync(() => ({ prefersReducedMotion: false })),
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
  // Unfocusable and unannounced, not merely transparent.
  expect(ctaComputedVisibility()).toBe('hidden');
});

test('the CTA appears once the hero scrolls away and hides again on return', async () => {
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
  await expect.poll(ctaVisible, { timeout: 3000 }).toBe(true);
  await expect.poll(ctaComputedVisibility, { timeout: 3000 }).toBe('visible');

  window.scrollTo({ top: 0, behavior: 'instant' });
  await expect.poll(ctaVisible, { timeout: 3000 }).toBe(false);
  // The visibility leg is delayed by the fade’s duration, so this is also the
  // guard that the delay is on the way OUT only.
  await expect.poll(ctaComputedVisibility, { timeout: 3000 }).toBe('hidden');
});

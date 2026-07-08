import { Runtime } from 'foldkit';
import { beforeAll, expect, test } from 'vitest';
import { page } from 'vitest/browser';

import { ChangedUrl, ClickedLink, Model, init, update, view } from './main';
import './styles.css';

// A browser-mode integration test: it mounts the real app into a real DOM so
// the actual stylesheet decides whether the menu overlay is painted. This
// guards the fix for the iOS bug where a closed overlay kept painting (a black
// band under Safari's toolbar) — the invariant is simply "a closed menu is
// never visible", verified through computed styles rather than internal state.

const overlay = (): HTMLElement => {
  const element = document.querySelector<HTMLElement>('.menu-overlay');
  if (!element) throw new Error('menu overlay not rendered');
  return element;
};

const overlayVisibility = (): string => getComputedStyle(overlay()).visibility;
const overlayIsOpen = (): boolean => overlay().classList.contains('is-open');

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

  await waitUntil(() => document.querySelector('.menu-overlay') !== null);
});

// A click drives the Foldkit runtime, which re-renders on its own schedule,
// so every state assertion is polled rather than checked synchronously right
// after the click — otherwise it races the async render (WebKit is slower
// than Chromium and reliably lost that race).

test('the overlay is hidden before the menu is opened', () => {
  expect(overlayIsOpen()).toBe(false);
  expect(overlayVisibility()).toBe('hidden');
});

test('opening reveals the overlay, closing hides it again', async () => {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect.poll(overlayIsOpen).toBe(true);
  await expect.poll(overlayVisibility).toBe('visible');

  await page.getByRole('button', { name: 'Close menu' }).click();
  await expect.poll(overlayIsOpen).toBe(false);
  // The overlay must actually stop being painted, not merely lose `is-open`.
  await expect.poll(overlayVisibility, { timeout: 2000 }).toBe('hidden');
});

test('choosing a menu item also closes and hides the overlay', async () => {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect.poll(overlayVisibility).toBe('visible');

  // `exact` — the landing page also has a "Discover all competitions →" CTA
  // whose accessible name contains this one.
  await page.getByRole('link', { name: 'Competitions', exact: true }).click();
  await expect.poll(overlayVisibility, { timeout: 2000 }).toBe('hidden');
});

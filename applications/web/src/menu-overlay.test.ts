import { Runtime } from 'foldkit';
import { beforeAll, expect, test } from 'vitest';
import { page } from 'vitest/browser';

import { ChangedUrl, ClickedLink, Model, init, subscriptions, update, view } from './main';
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
      subscriptions,
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

  await page.getByRole('link', { name: 'Battling through', exact: true }).click();
  await expect.poll(overlayVisibility, { timeout: 2000 }).toBe('hidden');
});

// The keyboard contract for a full-screen overlay: while it's open the page
// behind it is inert (Tab stays inside the overlay), Escape closes it, and
// focus lands back on the toggle that opened it.

test('the page behind the open overlay is inert', async () => {
  const main = document.querySelector<HTMLElement>('main');
  const footer = document.querySelector<HTMLElement>('footer');
  expect(main?.inert).toBe(false);
  expect(footer?.inert).toBe(false);

  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect.poll(() => document.querySelector<HTMLElement>('main')?.inert).toBe(true);
  await expect.poll(() => document.querySelector<HTMLElement>('footer')?.inert).toBe(true);

  await page.getByRole('button', { name: 'Close menu' }).click();
  await expect.poll(() => document.querySelector<HTMLElement>('main')?.inert).toBe(false);
  await expect.poll(() => document.querySelector<HTMLElement>('footer')?.inert).toBe(false);
});

test('Escape closes the overlay and returns focus to the toggle', async () => {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect.poll(overlayVisibility).toBe('visible');

  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await expect.poll(overlayVisibility, { timeout: 2000 }).toBe('hidden');
  expect(document.activeElement?.id).toBe('menu-toggle');
});

test('Escape does nothing while the menu is closed', async () => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  // Give a would-be handler a beat to misfire before asserting.
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(overlayIsOpen()).toBe(false);
  expect(overlayVisibility()).toBe('hidden');
});

// The overlay marks the section the viewport sat in when it opened: the
// matching anchor carries aria-current and the brand full stop. At the top
// of the page (the hero) nothing is marked.

test('the open overlay marks the section the viewport is in', async () => {
  // An earlier test navigated to /#battling-through — park back at the hero.
  window.scrollTo({ top: 0, behavior: 'instant' });

  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect.poll(overlayVisibility).toBe('visible');
  // At the hero there is no section to mark.
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(overlay().querySelector('a[aria-current="location"]')).toBeNull();

  await page.getByRole('button', { name: 'Close menu' }).click();
  await expect.poll(overlayVisibility, { timeout: 2000 }).toBe('hidden');
  // Wait out the scroll-lock release before scrolling — while the page is
  // locked (Dom.lockScroll sets overflow: hidden) the jump below might not
  // take.
  await waitUntil(() => document.documentElement.style.overflow !== 'hidden');

  const clubs = document.getElementById('across-the-lands');
  if (!clubs) throw new Error('across-the-lands section not rendered');
  window.scrollTo({
    top: clubs.getBoundingClientRect().top + window.scrollY + 10,
    behavior: 'instant',
  });

  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect.poll(overlayVisibility).toBe('visible');
  await expect
    .poll(() => overlay().querySelector('a[aria-current="location"]')?.textContent)
    .toBe('Across the lands.');

  await page.getByRole('button', { name: 'Close menu' }).click();
  await expect.poll(overlayVisibility, { timeout: 2000 }).toBe('hidden');
});

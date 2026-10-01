import { expect, test, vi } from 'vite-plus/test';

import { SITE_ORIGIN } from '../document-title';
import { expectHydrationAdopts } from './adopts';

const canonical = (): string | null | undefined =>
  document.querySelector('link[rel="canonical"]')?.getAttribute('href');
const ogUrl = (): string | null | undefined =>
  document.querySelector('meta[property="og:url"]')?.getAttribute('content');

// Foldkit writes the canonical and og:url only when the view supplies them, and an omitted field
// leaves whatever the head already holds. A view that left them to the server render kept the
// landing page's URL after a client-side move to the policy page, so this follows one.
test('a client-side move to the policy page moves the canonical and og:url', async () => {
  await expectHydrationAdopts('/');
  expect(canonical()).toBe(`${SITE_ORIGIN}/`);

  const policyLink = document.querySelector<HTMLAnchorElement>('a[href="/policy"]');
  if (policyLink === null) throw new Error('the landing page renders no link to the policy page');
  policyLink.click();

  await vi.waitUntil(() => canonical() === `${SITE_ORIGIN}/policy`);
  expect(ogUrl()).toBe(`${SITE_ORIGIN}/policy`);
});

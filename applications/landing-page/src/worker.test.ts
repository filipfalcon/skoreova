import { expect, test } from 'vite-plus/test';

import worker, { SITE_ORIGIN } from './worker';

const TEMPLATE =
  '<!doctype html><html lang="en"><head><title>Skóreová</title></head><body><div id="root"></div></body></html>';

// An ASSETS binding that serves the shell and counts the reads, so a test can tell whether a
// request read the shell at all.
const environment = () => {
  const reads: Array<string> = [];
  return {
    reads,
    env: {
      ASSETS: {
        fetch: async (request: Request) => {
          reads.push(new URL(request.url).pathname);
          return new Response(TEMPLATE, { headers: { 'Content-Type': 'text/html' } });
        },
      },
    },
  };
};

const page = (path: string) =>
  new Request(`${SITE_ORIGIN}${path}`, { headers: { Accept: 'text/html' } });

// The shell's own URL is a static file; served as one it would be an empty page at 200.
test('the shell URL redirects permanently to the page it becomes', async () => {
  const { env, reads } = environment();
  const response = await worker.fetch(page('/index.html'), env);
  expect(response.status).toBe(301);
  expect(response.headers.get('Location')).toBe(`${SITE_ORIGIN}/`);
  expect(reads).toEqual([]);
});

test('the redirect keeps the query', async () => {
  const { env } = environment();
  const response = await worker.fetch(page('/index.html?utm_source=newsletter'), env);
  expect(response.headers.get('Location')).toBe(`${SITE_ORIGIN}/?utm_source=newsletter`);
});

test('a page still renders through the shell', async () => {
  const { env, reads } = environment();
  const response = await worker.fetch(page('/policy'), env);
  expect(response.status).toBe(200);
  expect(reads).toEqual(['/index.html']);
  expect(await response.text()).toContain('data-foldkit-app');
});

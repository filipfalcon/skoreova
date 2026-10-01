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
      TICKER: { get: async () => null, put: async () => {} },
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
  const response = await worker.fetch(page('/clubs'), env);
  expect(response.status).toBe(200);
  expect(reads).toEqual(['/index.html']);
  expect(await response.text()).toContain('data-foldkit-app');
});

const withMethod = (path: string, method: string) =>
  new Request(`${SITE_ORIGIN}${path}`, { method, headers: { Accept: 'text/html' } });

// Pages are read-only: GET and HEAD read them, OPTIONS describes them, and every
// other method is refused with the list of what is allowed.
test('a page refuses a write and names the methods it allows', async () => {
  const { env } = environment();
  const response = await worker.fetch(withMethod('/clubs', 'POST'), env);
  expect(response.status).toBe(405);
  expect(response.headers.get('Allow')).toBe('GET, HEAD, OPTIONS');
});

test('OPTIONS describes a page without rendering it', async () => {
  const { env } = environment();
  const response = await worker.fetch(withMethod('/clubs', 'OPTIONS'), env);
  expect(response.status).toBe(204);
  expect(response.headers.get('Allow')).toBe('GET, HEAD, OPTIONS');
  expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
});

test('a rendered page holds the browser to its content type', async () => {
  const { env } = environment();
  const response = await worker.fetch(page('/clubs'), env);
  expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
});

test('HEAD answers with the page headers and no body', async () => {
  const { env } = environment();
  const response = await worker.fetch(withMethod('/clubs', 'HEAD'), env);
  expect(response.status).toBe(200);
  expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  expect(await response.text()).toBe('');
});

test('the shell URL refuses a write instead of redirecting it', async () => {
  const { env } = environment();
  const response = await worker.fetch(withMethod('/index.html', 'POST'), env);
  expect(response.status).toBe(405);
  expect(response.headers.get('Location')).toBeNull();
});

// The Worker's own endpoints follow the same rules as the pages.
test('the sitemap answers HEAD without a body and refuses a write', async () => {
  const { env } = environment();
  const head = await worker.fetch(withMethod('/sitemap.xml', 'HEAD'), env);
  expect(head.status).toBe(200);
  expect(head.headers.get('Content-Type')).toBe('application/xml; charset=utf-8');
  expect(head.headers.get('X-Content-Type-Options')).toBe('nosniff');
  expect(await head.text()).toBe('');
  const post = await worker.fetch(withMethod('/sitemap.xml', 'POST'), env);
  expect(post.status).toBe(405);
  expect(post.headers.get('Allow')).toBe('GET, HEAD, OPTIONS');
});

test('the ticker endpoint refuses a write', async () => {
  const { env } = environment();
  const response = await worker.fetch(withMethod('/api/ticker', 'PUT'), env);
  expect(response.status).toBe(405);
  expect(response.headers.get('Allow')).toBe('GET, HEAD, OPTIONS');
});

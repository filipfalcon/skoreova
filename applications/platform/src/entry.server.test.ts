import { expect, test } from 'vite-plus/test';

import { renderPage } from './entry.server';
import { SITE_ORIGIN } from './site';

// The point of rendering on the server is that the DOCUMENT carries the page.
// The tags were already right before it — a rewriter retagged the shell — so
// asserting only on the title would have passed against the empty body this
// exists to fill. Each test names something a crawler could not have read.

const render = async (path: string) => {
  const result = await renderPage(new Request(`${SITE_ORIGIN}${path}`));
  if (result._tag !== 'Rendered') throw new Error(`expected a rendered page for ${path}`);
  return result;
};

test('a club profile arrives with its content in the HTML', async () => {
  const { application } = await render('/clubs/sparta-praha');
  expect(application.html).toContain('Sparta Praha');
  // Not just the name in a tag: the profile's own sections are in the body.
  expect(application.html).toContain('Top scorers');
});

test('every route names itself rather than the front page', async () => {
  const club = await render('/clubs/sparta-praha');
  const competitions = await render('/competitions');
  expect(club.application.canonical).toBe(`${SITE_ORIGIN}/clubs/sparta-praha`);
  expect(competitions.application.canonical).toBe(`${SITE_ORIGIN}/competitions`);
  expect(club.application.title).not.toBe(competitions.application.title);
  // og:url tracked the canonical in the rewriter and still does.
  expect(club.application.ogUrl).toBe(club.application.canonical);
});

// The canonical is built from the ROUTE, so a shared link's campaign
// parameters fold onto the one document they name instead of minting a copy.
test('query parameters do not mint a second canonical', async () => {
  const plain = await render('/clubs/sparta-praha');
  const shared = await render('/clubs/sparta-praha?utm_source=instagram');
  expect(shared.application.canonical).toBe(plain.application.canonical);
});

test('an unknown path renders the not-found screen and says so in the status', async () => {
  const result = await renderPage(new Request(`${SITE_ORIGIN}/clubs/sparta-praha/nope`));
  if (result._tag !== 'Rendered') throw new Error('expected a rendered page');
  expect(result.status).toBe(404);
  expect(result.application.html).toContain('Nothing here.');
});

// Hydration compares the stamp before it adopts any DOM, so a render without
// one is a page no client can take over.
test('the render is stamped with the build it came from', async () => {
  const { application } = await render('/');
  expect(application.html).toContain('data-foldkit-build');
  expect(application.html).toContain('data-foldkit-app');
});

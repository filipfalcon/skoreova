import { expect, test } from 'vite-plus/test';

import { SITE_ORIGIN } from './document-title';
import { renderPage } from './entry.server';

// The point of rendering on the server is that the DOCUMENT carries the page.
// The tags were already right before it — the Worker retagged a client-rendered
// shell — so asserting on the title alone would have passed against the empty
// body this exists to fill. Each test names something a crawler could not have
// read from the old document.

const render = async (path: string) => {
  const result = await renderPage(new Request(`${SITE_ORIGIN}${path}`));
  if (result._tag !== 'Rendered') throw new Error(`expected a rendered page for ${path}`);
  return result;
};

// What the external audit actually measured: text, with the markup taken off.
const textOf = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

test('the landing page arrives with its headline in the HTML', async () => {
  const { application } = await render('/');
  // The h1, in three lines.
  expect(application.html).toContain('Discover');
  expect(application.html).toContain('Her');
  expect(application.html).toContain('In Czechia');
  // Not just the headline: sections far below the fold are in the body too,
  // which is what makes the reveal system safe to prerender — it gates
  // styling, not markup.
  expect(application.html).toContain('Enter platform');
});

// THE GUARD. A prerender that silently degrades to the empty shell still builds
// green and still deploys; the only thing that changes is the number an
// external crawler reads. The audit that started this work reported 115
// characters and asked for 500+, so that is the line this holds.
test('the document carries a page worth reading without JavaScript', async () => {
  const { application } = await render('/');
  const text = textOf(application.html);
  expect(
    text.length,
    `the rendered body carries ${text.length} characters of text; it used to be 73`,
  ).toBeGreaterThan(500);
});

test('the policy page renders itself, not the landing page', async () => {
  const { application } = await render('/policy');
  expect(application.html).toContain('Cookies, plainly.');
  expect(application.title).toContain('Cookies');
});

test('every route names itself rather than the front page', async () => {
  const landing = await render('/');
  const policy = await render('/policy');
  expect(landing.application.canonical).toBe(`${SITE_ORIGIN}/`);
  expect(policy.application.canonical).toBe(`${SITE_ORIGIN}/policy`);
  expect(landing.application.title).not.toBe(policy.application.title);
  // og:url tracked the canonical in the rewriter and still does.
  expect(policy.application.ogUrl).toBe(policy.application.canonical);
});

// The canonical is built from the request PATH, so a shared link's campaign
// parameters fold onto the one document they name instead of minting a copy.
// Without the explicit override the render defaults it to the request URL with
// the query kept, which is the behaviour this asserts is not in effect.
test('query parameters do not mint a second canonical', async () => {
  const plain = await render('/');
  const shared = await render('/?utm_source=instagram');
  expect(shared.application.canonical).toBe(plain.application.canonical);
});

test('an unknown path renders the landing screen and says so in the status', async () => {
  const result = await renderPage(new Request(`${SITE_ORIGIN}/nope`));
  if (result._tag !== 'Rendered') throw new Error('expected a rendered page');
  expect(result.status).toBe(404);
  expect(result.application.html).toContain('Discover');
});

// Hydration compares the stamp before it adopts any DOM, so a render without
// one is a page no client can take over.
test('the render is stamped with the build it came from', async () => {
  const { application } = await render('/');
  expect(application.html).toContain('data-foldkit-build');
  expect(application.html).toContain('data-foldkit-app');
});

// An external audit read the rendered page as having a "flat heading structure".
// It does not — one h1, eight h2 sections, nine h3 subsections, no skipped
// levels — but nothing held that shape in place, and a heading level is exactly
// the kind of thing a styling change moves without anyone noticing. Screen
// readers navigate by this outline and crawlers read topic structure off it.
test('the rendered page has one h1 and a heading outline with no skipped levels', async () => {
  const { application } = await render('/');
  const levels = [...application.html.matchAll(/<h([1-6])\b/g)].map(([, level = '0']) =>
    Number(level),
  );

  expect(levels.filter((level) => level === 1)).toHaveLength(1);
  expect(levels[0], 'the document does not open on its h1').toBe(1);

  // A jump from h2 straight to h4 leaves a hole in a reader's outline. Going
  // back UP any distance is fine — that is just the next section starting.
  for (const [index, level] of levels.entries()) {
    const previous = levels[index - 1];
    if (previous !== undefined && level > previous) {
      expect(level, `heading ${index} jumps from h${previous} to h${level}`).toBe(previous + 1);
    }
  }
});

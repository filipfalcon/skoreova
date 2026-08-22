// The deployed Worker entry for the platform (alchemy.run.ts points `main`
// here). Four jobs in one module:
//
// - `fetch` — serves `/api/ticker` (the clubs' percentages) straight from
//   KV with a Cache-Control header, so the edge cache absorbs most reads
//   and the KV read count stays flat under traffic. Note: static assets are
//   served BEFORE the Worker runs, so this handler only sees non-asset
//   requests.
// - the page render — every other request is answered by rendering the app
//   against the requested URL and placing that markup in the HTML shell.
//   This replaced an HTMLRewriter pass that retagged a client-rendered
//   shell: a crawler reads the document before it runs the app, so the tags
//   had to be right, but the BODY was empty either way. The tags now come
//   from the same `Document` the app returns, and the body arrives with
//   them.
// - `/sitemap.xml` — generated from the routers and the profile maps, so it
//   cannot go stale against them. The path used to fall through to the SPA
//   and answer HTML with a 200.
// - `scheduled` — the daily ticker refresh (cron in alchemy.run.ts):
//   rewrites the single `ticker:clubs` KV key.
//
// The endpoint ships AHEAD of its consumer: the home page’s tape still
// renders the local `tape` array in page/welcome.ts, so nothing fetches
// /api/ticker yet. It exists so the KV key, the cron, and the edge-cache
// headers are proven in production before the tape depends on them —
// switching the hero over is one fetch Command, and the endpoint already
// answers with the base data before the first cron fire.
//
// BASE stands in for the stats API: every cron run rewrites the same clubs
// with a small random offset, so the tape visibly moves day to day. Real
// percentages replace it when that API exists.

import { Server } from 'foldkit/experimental';

import { clubNames, competitionNames } from './document-title';
import {
  clubRouter,
  clubsRouter,
  competitionRouter,
  competitionsRouter,
  herGameRouter,
  matchesRouter,
  officialsRouter,
  playersRouter,
  welcomeRouter,
} from './route';
import { SITE_ORIGIN } from './site';
import { renderPage } from './entry.server';
import { tickerQuotes } from './ticker';

export const TICKER_KEY = 'ticker:clubs';

export { SITE_ORIGIN };

interface TickerClub {
  readonly slug: string;
  readonly name: string;
  // Percentage points, always positive — direction lives in `up`.
  readonly delta: number;
  readonly up: boolean;
}

// The movements come from ticker.ts, the one place the quoted clubs are
// authored. The NAMES stay here: this module is a separate deployable and
// importing the clubs table would drag every crest PNG into a Worker bundle,
// so data.test.ts holds these to the same table the tape resolves against.
export const CLUB_NAMES: Record<string, string> = {
  pardubice: 'Pardubice',
  'slavia-praha': 'Slavia Praha',
  'banik-ostrava': 'Baník Ostrava',
  teplice: 'Teplice',
  'sparta-praha': 'Sparta Praha',
  'prague-raptors': 'Prague Raptors',
  'sigma-olomouc': 'Sigma Olomouc',
  slovacko: 'Slovácko',
  'viktoria-plzen': 'Viktoria Plzeň',
  'hradec-kralove': 'Hradec Králové',
  'vysocina-jihlava': 'Vysočina Jihlava',
  'lokomotiva-brno': 'Lokomotiva Brno',
  'slovan-liberec': 'Slovan Liberec',
};

export const BASE: ReadonlyArray<TickerClub> = tickerQuotes.map((quote) => ({
  slug: quote.slug,
  name: CLUB_NAMES[quote.slug] ?? quote.slug,
  delta: quote.delta,
  up: quote.isUp,
}));

// ±10% of the base value, but at least a whole point, so even the small
// quotes move; never drops below 1.
const jitter = (value: number): number => {
  const spread = Math.max(1, Math.round(value * 0.1));
  const offset = Math.round((Math.random() * 2 - 1) * spread);
  return Math.max(1, value + offset);
};

const tickerDocument = (): string => {
  const clubs = BASE.map((club) => ({ ...club, delta: jitter(club.delta) }));
  return JSON.stringify({ updatedAt: new Date().toISOString(), clubs });
};

// Every path worth crawling, built from the routers rather than written out:
// a route that changes shape rewrites these with it, and the profile paths
// come from the same maps the titles do.
export const sitemapPaths = (): ReadonlyArray<string> => [
  welcomeRouter(),
  herGameRouter(),
  clubsRouter(),
  playersRouter(),
  matchesRouter(),
  competitionsRouter(),
  officialsRouter(),
  ...Object.keys(clubNames).map((slug) => clubRouter({ slug })),
  ...Object.keys(competitionNames).map((slug) => competitionRouter({ slug })),
];

const sitemapDocument = (): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapPaths().map((path) => `  <url><loc>${SITE_ORIGIN}${path}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');

// Minimal local binding shapes — keeps this file free of
// @cloudflare/workers-types inside the platform app’s DOM tsconfig.
interface Env {
  readonly ASSETS: { fetch(request: Request): Promise<Response> };
  readonly TICKER: {
    get(key: string): Promise<string | null>;
    put(key: string, value: string): Promise<void>;
  };
}

// THE SHELL — the built index.html, read from the assets binding rather than
// imported from source. The source template names `/src/entry.ts`; the one
// beside the deployed assets names the hashed bundle, and it is the only copy
// that can never disagree with what the browser will actually be asked to
// load. The binding is a local lookup rather than a network call, so this is
// read per request instead of held in a module-level cache the Model does not
// own.
const shell = (env: Env, url: URL): Promise<string> =>
  env.ASSETS.fetch(new Request(new URL('/index.html', url.origin))).then((response) =>
    response.text(),
  );

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/ticker') {
      // Before the first cron fire the key is empty — serve the base data
      // (unjittered) instead of a 404, so the endpoint is always usable.
      const stored = await env.TICKER.get(TICKER_KEY);
      const body = stored ?? JSON.stringify({ updatedAt: null, clubs: BASE });
      return new Response(body, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          // The data changes once a day — an hour of edge cache keeps KV
          // reads flat under traffic while staying fresh after the cron.
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    if (url.pathname === '/sitemap.xml') {
      return new Response(sitemapDocument(), {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    // A method the `Request` constructor rejects can never reach an entry, so
    // it is refused here rather than turned into a 500 further in.
    if (Server.isHostSettledMethod(request.method)) {
      return new Response(null, {
        status: Server.HOST_METHOD_ANSWERS.refusedStatus,
        headers: { Allow: Server.HOST_METHOD_ANSWERS.allow },
      });
    }
    // A request that matched no file is not automatically a page. A browser
    // asks for scripts, styles and images with `Accept: */*`, which accepts
    // HTML, so a hashed bundle that is no longer deployed would otherwise be
    // answered with the shell at 200 — a stale client would read that as its
    // own JavaScript. Classifying the miss answers it as the miss it is.
    if (
      Server.classifyRequest(request.url, request.headers.get('sec-fetch-dest') ?? undefined) !==
      'Page'
    ) {
      return new Response('Not found', { status: 404 });
    }
    return Server.toResponse(await shell(env, url), await renderPage(request));
  },

  async scheduled(_controller: unknown, env: Env): Promise<void> {
    await env.TICKER.put(TICKER_KEY, tickerDocument());
  },
};

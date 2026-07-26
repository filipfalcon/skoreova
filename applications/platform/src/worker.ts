// The deployed Worker entry for the platform (alchemy.run.ts points `main`
// here). Two jobs in one module:
//
// - `fetch` — serves `/api/ticker` (the clubs' percentages) straight from
//   KV with a Cache-Control header, so the edge cache absorbs most reads
//   and the KV read count stays flat under traffic; everything else
//   forwards to the assets binding (the SPA). Note: static assets are
//   served BEFORE the Worker runs, so this handler only sees non-asset
//   requests.
// - `scheduled` — the daily ticker refresh (cron in alchemy.run.ts):
//   rewrites the single `ticker:clubs` KV key.
//
// The endpoint ships AHEAD of its consumer: the home page's tape still
// renders the local `tape` array in page/welcome.ts, so nothing fetches
// /api/ticker yet. It exists so the KV key, the cron, and the edge-cache
// headers are proven in production before the tape depends on them —
// switching the hero over is one fetch Command, and the endpoint already
// answers with the base data before the first cron fire.
//
// BASE stands in for the stats API: every cron run rewrites the same clubs
// with a small random offset, so the tape visibly moves day to day. Real
// percentages replace it when that API exists.

import { tickerQuotes } from './ticker';

export const TICKER_KEY = 'ticker:clubs';

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
const CLUB_NAMES: Record<string, string> = {
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

// Minimal local binding shapes — keeps this file free of
// @cloudflare/workers-types inside the platform app's DOM tsconfig.
interface Env {
  readonly ASSETS: { fetch(request: Request): Promise<Response> };
  readonly TICKER: {
    get(key: string): Promise<string | null>;
    put(key: string, value: string): Promise<void>;
  };
}

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
    return env.ASSETS.fetch(request);
  },

  async scheduled(_controller: unknown, env: Env): Promise<void> {
    await env.TICKER.put(TICKER_KEY, tickerDocument());
  },
};

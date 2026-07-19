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
// TODO(prod): replace BASE with a fetch from the stats API and a real
// percentage computation. Until then every cron run rewrites the same
// clubs with a small random offset, so the tape visibly moves day to day.

export const TICKER_KEY = 'ticker:clubs';

interface TickerClub {
  readonly slug: string;
  readonly name: string;
  // Percentage points, always positive — direction lives in `up`.
  readonly delta: number;
  readonly up: boolean;
}

const BASE: ReadonlyArray<TickerClub> = [
  { slug: 'pardubice', name: 'FK Pardubice', delta: 345, up: true },
  { slug: 'slavia-praha', name: 'Slavia Praha', delta: 9, up: false },
  { slug: 'banik-ostrava', name: 'Baník Ostrava', delta: 11, up: true },
  { slug: 'teplice', name: 'Teplice', delta: 12, up: false },
  { slug: 'sparta-praha', name: 'Sparta Praha', delta: 4, up: true },
  { slug: 'prague-raptors', name: 'Prague Raptors', delta: 6, up: false },
  { slug: 'sigma-olomouc', name: 'Sigma Olomouc', delta: 17, up: true },
  { slug: 'slovacko', name: 'Slovácko', delta: 3, up: false },
  { slug: 'viktoria-plzen', name: 'Viktoria Plzeň', delta: 8, up: true },
  { slug: 'hradec-kralove', name: 'Hradec Králové', delta: 14, up: true },
  { slug: 'vysocina-jihlava', name: 'Vysočina Jihlava', delta: 5, up: false },
  { slug: 'lokomotiva-brno', name: 'Lokomotiva Brno', delta: 21, up: true },
  { slug: 'slovan-liberec', name: 'Slovan Liberec', delta: 2, up: false },
];

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

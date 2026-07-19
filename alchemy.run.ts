import * as Alchemy from 'alchemy';
import * as Cloudflare from 'alchemy/Cloudflare';
import * as Effect from 'effect/Effect';

export default Alchemy.Stack(
  'Skoreova',
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const studio = yield* Cloudflare.Website.Vite('Studio', {
      rootDir: 'applications/studio',
      workersDev: false,
      domains: ['beta.studio.skoreova.com', 'beta.studio.skoreova.cz'],
      dev: { host: '0.0.0.0', port: 5172 },
      assets: {
        notFoundHandling: 'single-page-application',
      },
    });

    // The ticker's club percentages — ONE KV key holding all clubs as one
    // JSON document ('ticker:clubs'). The platform Worker below both
    // refreshes it (daily cron) and serves it (/api/ticker), so reads stay
    // a single KV get per pageview behind the edge cache.
    const tickerKv = yield* Cloudflare.KV.Namespace('Ticker');

    const platform = yield* Cloudflare.Website.Vite('Platform', {
      rootDir: 'applications/platform',
      workersDev: false,
      domains: ['beta.platform.skoreova.com', 'beta.platform.skoreova.cz'],
      dev: { host: '0.0.0.0', port: 5171 },
      // Custom Worker entry: /api/ticker from KV + assets pass-through,
      // plus the daily (04:00 UTC) scheduled refresh of the ticker key.
      // Mock numbers for now — see the TODO(prod) in worker.ts. Workers
      // Cache lets the /api/ticker Cache-Control header actually cache at
      // the edge, so most reads never invoke the Worker or KV.
      main: 'src/worker.ts',
      crons: ['0 4 * * *'],
      cache: { enabled: true },
      env: { TICKER: tickerKv },
      assets: {
        notFoundHandling: 'single-page-application',
      },
    });

    const web = yield* Cloudflare.Website.Vite('Web', {
      rootDir: 'applications/web',
      workersDev: false,
      domains: ['beta.skoreova.com', 'beta.skoreova.cz'],
      dev: { host: '0.0.0.0', port: 5170 },
      // Custom Worker entry: a Sentry-wrapped pass-through to the assets
      // binding, so edge-side failures get reported too (the browser SDK
      // in entry.ts covers the client). Builds through the `ssr` Vite
      // environment — see the buildApp note in applications/web/vite.config.ts.
      // The Sentry SDK needs AsyncLocalStorage, hence `nodejs_als`.
      main: 'src/worker.ts',
      compatibility: {
        flags: ['nodejs_als'],
      },
      assets: {
        notFoundHandling: 'single-page-application',
      },
    });

    return {
      studio: studio.allUrls,
      web: web.allUrls,
      platform: platform.allUrls,
    };
  }),
);

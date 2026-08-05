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
    const landingPage = yield* Cloudflare.Website.Vite('LandingPage', {
      rootDir: 'applications/web',
      workersDev: {
        enabled: false,
        previewsEnabled: false,
      },
      domain: {
        name: 'skoreova.com',
        aliases: ['skoreova.cz'],
      },
      dev: { host: '127.0.0.1', port: 5180, strictPort: true },
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

    // The ticker’s club percentages — ONE KV key holding all clubs as one
    // JSON document ('ticker:clubs'). The platform Worker below both
    // refreshes it (daily cron) and serves it (/api/ticker), so reads stay
    // a single KV get per pageview behind the edge cache.
    const tickerKv = yield* Cloudflare.KV.Namespace('Ticker');

    const platform = yield* Cloudflare.Website.Vite('Platform', {
      rootDir: 'applications/platform',
      workersDev: {
        enabled: false,
        previewsEnabled: false,
      },
      domain: {
        name: 'platform.skoreova.com',
        aliases: ['platform.skoreova.cz'],
      },
      dev: { host: '127.0.0.1', port: 5181, strictPort: true },
      // Custom Worker entry: /api/ticker from KV + assets pass-through,
      // plus the daily (04:00 UTC) scheduled refresh of the ticker key.
      // Mock numbers for now. Workers
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

    const studio = yield* Cloudflare.Website.Vite('Studio', {
      rootDir: 'applications/studio',
      workersDev: {
        enabled: false,
        previewsEnabled: false,
      },
      domain: {
        name: 'studio.skoreova.com',
        aliases: ['studio.skoreova.cz'],
      },
      dev: { host: '127.0.0.1', port: 5182, strictPort: true },
      assets: {
        notFoundHandling: 'single-page-application',
      },
    });

    return {
      landingPage: landingPage.url,
      platform: platform.url,
      studio: studio.url,
    };
  }),
);

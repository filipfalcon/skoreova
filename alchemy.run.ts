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
    const landingPage = yield* Cloudflare.Website.Foldkit('LandingPage', {
      rootDir: 'applications/landing-page',
      workersDev: {
        enabled: false,
        previewsEnabled: false,
      },
      domain: {
        name: 'skoreova.com',
        aliases: ['skoreova.cz'],
      },
      dev: { port: 5180, strictPort: true },
      // Custom Worker entry: a Sentry-wrapped pass-through to the assets
      // binding, so edge-side failures get reported too (the browser SDK
      // in entry.ts covers the client). Builds through the `ssr` Vite
      // environment — see the buildApp note in applications/landing-page/vite.config.ts.
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

    const platform = yield* Cloudflare.Website.Foldkit('Platform', {
      rootDir: 'applications/platform',
      workersDev: {
        enabled: false,
        previewsEnabled: false,
      },
      domain: {
        name: 'platform.skoreova.com',
        aliases: ['platform.skoreova.cz'],
      },
      dev: { port: 5181, strictPort: true },
      // Custom Worker entry: /api/ticker from KV + assets pass-through,
      // plus the daily (04:00 UTC) scheduled refresh of the ticker key.
      // Mock numbers for now. Workers
      // Cache lets the /api/ticker Cache-Control header actually cache at
      // the edge, so most reads never invoke the Worker or KV.
      main: 'src/worker.ts',
      crons: ['0 4 * * *'],
      cache: { enabled: true },
      env: { TICKER: tickerKv },
      // THE PLATFORM RENDERS ON THE SERVER, so neither asset default may
      // stand. `single-page-application` answered every unmatched path with
      // the un-rendered shell, which is the whole of what SSR replaces —
      // every deep link would have been served the empty document again, and
      // nothing would have failed to say so. `htmlHandling: 'none'` is the
      // other half: without it the asset layer resolves `/` to `/index.html`
      // on its own and the front page alone would arrive unrendered.
      //
      // Files still come from the asset layer directly — only requests that
      // match no file reach the Worker, which is exactly the set of pages.
      // `/index.html` keeps matching literally, which is what the Worker
      // reads its shell from.
      assets: {
        htmlHandling: 'none',
        notFoundHandling: 'none',
      },
    });

    const studio = yield* Cloudflare.Website.Foldkit('Studio', {
      rootDir: 'applications/studio',
      workersDev: {
        enabled: false,
        previewsEnabled: false,
      },
      domain: {
        name: 'studio.skoreova.com',
        aliases: ['studio.skoreova.cz'],
      },
      dev: { port: 5182, strictPort: true },
      assets: {
        notFoundHandling: 'single-page-application',
      },
    });

    return {
      landingPage: landingPage.urls,
      platform: platform.urls,
      studio: studio.urls,
    };
  }),
);

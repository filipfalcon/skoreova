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
      assets: {
        notFoundHandling: 'single-page-application',
      },
    });

    const platform = yield* Cloudflare.Website.Vite('Platform', {
      rootDir: 'applications/platform',
      workersDev: false,
      domains: ['beta.platform.skoreova.com', 'beta.platform.skoreova.cz'],
      assets: {
        notFoundHandling: 'single-page-application',
      },
    });

    const web = yield* Cloudflare.Website.Vite('Web', {
      rootDir: 'applications/web',
      workersDev: false,
      domains: ['beta.skoreova.com', 'beta.skoreova.cz'],
      dev: { host: '0.0.0.0', port: 5173 },
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
      studio: studio.url,
      web: web.allUrls,
      platform: platform.url,
    };
  }),
);

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

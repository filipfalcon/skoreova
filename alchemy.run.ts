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
    const studio = yield* Cloudflare.Vite('Studio', {
      rootDir: 'applications/studio',
      url: false,
      domain: 'studio.skoreova.filipfalcon.com',
      assets: {
        notFoundHandling: 'single-page-application',
      },
    });

    const platform = yield* Cloudflare.Vite('Platform', {
      rootDir: 'applications/platform',
      url: false,
      domain: 'platform.skoreova.filipfalcon.com',
      assets: {
        notFoundHandling: 'single-page-application',
      },
    });

    const web = yield* Cloudflare.Vite('Web', {
      rootDir: 'applications/web',
      url: false,
      domain: 'skoreova.filipfalcon.com',
      assets: {
        notFoundHandling: 'single-page-application',
      },
    });

    return {
      studio: studio.url,
      web: web.url,
      platform: platform.url,
    };
  }),
);

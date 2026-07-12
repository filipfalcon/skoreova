import * as Sentry from '@sentry/cloudflare';

// The deployed Worker entry (alchemy.run.ts points `main` here). The site
// is a static SPA, so the handler only forwards to the assets binding —
// the wrapper exists to catch and report anything that goes wrong at the
// edge. Error monitoring only, mirroring the browser side in entry.ts:
// no tracing, so the wrap adds no per-request overhead worth noticing.
// Needs the `nodejs_als` compatibility flag (AsyncLocalStorage).
interface Env {
  readonly ASSETS: { fetch(request: Request): Promise<Response> };
}

export default Sentry.withSentry(
  () => ({
    dsn: 'https://e4a8e88469481b1b99170df7523983b9@o4511717331107840.ingest.de.sentry.io/4511717341790288',
    tracesSampleRate: 0,
  }),
  {
    fetch: (request: Request, env: Env): Promise<Response> => env.ASSETS.fetch(request),
  },
);

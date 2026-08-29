// The deployed Worker entry (alchemy.run.ts points `main` here). Every request
// that matches no static file is answered by rendering the app against the
// requested URL and placing that markup in the HTML shell.
//
// This replaced an HTMLRewriter pass that retagged a client-rendered shell.
// A crawler reads the document before it runs the app, so the tags had to be
// right — but the BODY was empty either way, which is what an external audit
// eventually measured (115 characters of text, all of it the cookie banner).
// The tags now come from the same `Document` the app returns, and the body
// arrives with them.
//
// The Sentry wrapper catches and reports anything that goes wrong at the edge.
// Error monitoring only, mirroring the browser side in entry.ts: no tracing,
// so the wrap adds no per-request overhead worth noticing. Needs the
// `nodejs_als` compatibility flag (AsyncLocalStorage).

import * as Sentry from '@sentry/cloudflare';
import { Server } from 'foldkit/experimental';

import { SITE_ORIGIN } from './document-title';
import { renderPage } from './entry.server';

export { SITE_ORIGIN };

interface Env {
  readonly ASSETS: { fetch(request: Request): Promise<Response> };
}

// The shell is read from the DEPLOYED assets rather than imported from source.
// The source template names `/src/entry.ts`; the one beside the deployed assets
// names the hashed bundle, and it is the only copy that can never disagree with
// what the browser will actually be asked to load. It also carries the
// build-time work the vite plugins do to index.html — the inlined stylesheet,
// the inlined consent script, the font preloads — none of which exists in the
// source file. The binding is a local lookup rather than a network call, so
// this is read per request instead of held in a module-level cache.
const shell = (env: Env, url: URL): Promise<string> =>
  env.ASSETS.fetch(new Request(new URL('/index.html', url.origin))).then((response) =>
    response.text(),
  );

export default Sentry.withSentry(
  () => ({
    dsn: 'https://e4a8e88469481b1b99170df7523983b9@o4511717331107840.ingest.de.sentry.io/4511717341790288',
    tracesSampleRate: 0,
  }),
  {
    fetch: async (request: Request, env: Env): Promise<Response> => {
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
      return Server.toResponse(await shell(env, new URL(request.url)), await renderPage(request));
    },
  },
);

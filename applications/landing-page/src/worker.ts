import * as Sentry from '@sentry/cloudflare';
import { Option } from 'effect';
import { fromString } from 'foldkit/url';

import { SITE_ORIGIN, documentTitle } from './document-title';
import { urlToAppRoute } from './route';

// The deployed Worker entry (alchemy.run.ts points `main` here). The site is a
// static SPA, so the handler forwards to the assets binding and rewrites the
// document on the way out: every route is served the same index.html, whose
// `<title>`, canonical and og:url are written for the landing page, and a
// crawler reads those tags before it runs the app — so `/policy` was
// submitted in the sitemap while declaring itself a copy of `/`.
//
// The Sentry wrapper catches and reports anything that goes wrong at the edge.
// Error monitoring only, mirroring the browser side in entry.ts: no tracing,
// so the wrap adds no per-request overhead worth noticing. Needs the
// `nodejs_als` compatibility flag (AsyncLocalStorage).
interface Env {
  readonly ASSETS: { fetch(request: Request): Promise<Response> };
}

// Minimal local shapes for the runtime's streaming HTML rewriter — enough of
// it to retag a document, and no more, which keeps this file free of
// @cloudflare/workers-types inside the app's DOM tsconfig.
interface RewriterElement {
  setAttribute(name: string, value: string): void;
  setInnerContent(content: string): void;
}

interface Rewriter {
  on(selector: string, handlers: { element(element: RewriterElement): void }): Rewriter;
  transform(response: Response): Response;
}

declare const HTMLRewriter: new () => Rewriter;

// The served document, retagged for the route it is actually answering.
//
// The canonical drops the query string: campaign and referral parameters
// arrive on shared links and name the same document, so folding them onto one
// URL is the difference between one page and an unbounded family of copies.
const documentResponse = (response: Response, url: URL): Response => {
  if (!(response.headers.get('content-type') ?? '').includes('text/html')) return response;
  const parsed = fromString(url.toString());
  if (Option.isNone(parsed)) return response;
  const canonical = `${SITE_ORIGIN}${url.pathname}`;
  return new HTMLRewriter()
    .on('link[rel="canonical"]', {
      element: (element) => element.setAttribute('href', canonical),
    })
    .on('meta[property="og:url"]', {
      element: (element) => element.setAttribute('content', canonical),
    })
    .on('title', {
      element: (element) => element.setInnerContent(documentTitle(urlToAppRoute(parsed.value))),
    })
    .transform(response);
};

export default Sentry.withSentry(
  () => ({
    dsn: 'https://e4a8e88469481b1b99170df7523983b9@o4511717331107840.ingest.de.sentry.io/4511717341790288',
    tracesSampleRate: 0,
  }),
  {
    fetch: async (request: Request, env: Env): Promise<Response> =>
      documentResponse(await env.ASSETS.fetch(request), new URL(request.url)),
  },
);

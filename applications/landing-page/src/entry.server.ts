import { Effect, Option } from 'effect';
import { Server } from 'foldkit/experimental';
import { fromString } from 'foldkit/url';

import { SITE_ORIGIN } from './document-title';
import { init, routing, view } from './main';
import { urlToAppRoute } from './route';

// THE SERVER ENTRY — one Web Request in, one delivery result out. The host
// places the result into the HTML shell; nothing here knows which host called
// it (the Vite dev middleware, or the build-time prerender).
//
// There are no Flags: every screen this app draws derives from the URL, so the
// server knows nothing at render time that the browser does not. That is what
// keeps hydration honest without a serialized payload — the client calls the
// same `init` with the same URL and rebuilds the same Model. Reduced motion is
// the one thing the server cannot know, and it arrives through the
// reducedMotion subscription rather than riding in as a Flag; see the note on
// `init` in main.ts.
//
// Commands do NOT run in a server render. `init` returns none, so there is
// nothing here to lose.

/**
 * Renders one request into the markup and metadata the host will serve.
 *
 * @param request The request being answered.
 */
export const renderPage = (request: Request): Promise<Server.EntryResult> =>
  Effect.runPromise(
    Effect.gen(function* () {
      const application = yield* Server.renderToString(
        { routing, init, view },
        {
          url: request.url,
          buildId: import.meta.env.FOLDKIT_BUILD_ID,
        },
      );

      // The canonical drops the query string: campaign and referral parameters
      // arrive on shared links and name the same document, so folding them onto
      // one URL is the difference between one page and an unbounded family of
      // copies. The render would otherwise default both fields to the request
      // URL with the query KEPT — this is the explicit override its own docs
      // ask for. Set here rather than in the view because the view knows the
      // route, not the path that produced it.
      const canonical = `${SITE_ORIGIN}${new URL(request.url).pathname}`;

      // An unknown path still renders the app's own landing screen, but it says
      // so in the status line instead of answering 200 for a page that is not
      // there.
      const parsed = fromString(request.url);
      const isNotFound = Option.isSome(parsed) && urlToAppRoute(parsed.value)._tag === 'NotFound';

      return Server.Rendered(
        { ...application, canonical, ogUrl: canonical },
        isNotFound ? { status: 404 } : undefined,
      );
    }),
  );

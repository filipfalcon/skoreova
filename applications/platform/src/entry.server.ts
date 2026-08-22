import { Effect } from 'effect';
import { Server } from 'foldkit/experimental';

import { init, routing, view } from './main';
import { urlToAppRoute } from './route';
import { fromString } from 'foldkit/url';
import { Option } from 'effect';

// THE SERVER ENTRY — one Web Request in, one delivery result out. The host
// (the Worker, or the Vite dev server) places the result into the HTML shell;
// nothing here knows which one called it.
//
// There are no Flags: every screen this app draws derives from the URL, so the
// browser knows nothing at render time that the server does not. That is what
// keeps hydration honest without a serialized payload — the client calls the
// same `init` with the same URL and rebuilds the same Model.
//
// Commands do NOT run in a server render, which is exactly right for the two
// this app fires at boot: the pins come out of localStorage, which no server
// can see. The first paint carries no pinned boards and they arrive on
// hydration, rather than the server guessing at a list it would get wrong.

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

      // An unknown path still renders the app's own not-found screen, but it
      // says so in the status line instead of answering 200 for a page that
      // is not there.
      const parsed = fromString(request.url);
      const isNotFound =
        Option.isSome(parsed) && urlToAppRoute(parsed.value)._tag === 'NotFoundRoute';

      return Server.Rendered(application, isNotFound ? { status: 404 } : undefined);
    }),
  );

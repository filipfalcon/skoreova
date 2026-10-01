import { Effect, Option } from 'effect';
import { Server } from 'foldkit/experimental';
import { fromString } from 'foldkit/url';

import { init, routing, view } from './main';
import { BASE_HEADERS, answerNonReadMethod } from './http';
import { urlToAppRoute } from './route';

// THE SERVER ENTRY — one Web Request in, one delivery result out. The host
// (the Worker, or the Vite dev server) places the result into the HTML shell;
// nothing here knows which one called it.
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
      // Pages are read-only. The entry answers OPTIONS and refuses other
      // methods itself, so the dev server and the Worker agree on them.
      const answered = answerNonReadMethod(request.method);
      if (answered !== undefined) {
        return Server.Responded(answered);
      }

      const application = yield* Server.renderToString(
        { routing, init, view },
        {
          url: request.url,
        },
      );

      // An unknown path still renders the app's own landing screen, but it says
      // so in the status line instead of answering 200 for a page that is not
      // there.
      const parsed = fromString(request.url);
      const isNotFound = Option.isSome(parsed) && urlToAppRoute(parsed.value)._tag === 'NotFound';

      return Server.Rendered(application, {
        ...(isNotFound ? { status: 404 } : {}),
        headers: BASE_HEADERS,
      });
    }),
  );

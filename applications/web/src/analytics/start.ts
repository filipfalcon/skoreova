import { Effect, Option } from 'effect';

import { setUpBanner } from './banner';
import { readChoice } from './consent';
import { startGtag } from './gtag';

// `runSync`, not `runPromise` — a microtask here would let the document carry on
// past the point where the defaults have to be registered.
Effect.runSync(
  Effect.gen(function* () {
    // Read once and hand it to both: two reads of blockable storage are two
    // chances to disagree.
    const stored = yield* readChoice;

    // The tag goes first — the banner must not offer a choice nothing can act on.
    yield* startGtag(stored);

    const banner = Option.fromNullOr(document.getElementById('cookie-consent'));
    yield* Option.match(banner, {
      onNone: () => Effect.void,
      onSome: (element) => setUpBanner(element, stored),
    });
  }),
);

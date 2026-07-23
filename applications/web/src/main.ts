import { Match as M, Option } from 'effect';
import type { Runtime } from 'foldkit';
import { Command } from 'foldkit';
import { evo } from 'foldkit/struct';
import { toString as urlToString } from 'foldkit/url';

import type { AppRoute } from './route';
import { urlToAppRoute } from './route';
import type { Model } from './model';
import type { Message } from './message';
import { DetectActiveSection, Load, Navigate, SetScrollLock } from './command';

// The app entry: init, the update reducer, and the re-exports that keep the
// public surface (Model, messages, subscriptions, view) at ./main.
export * from './model';
export * from './message';
export { DetectActiveSection, Load, Navigate, SetScrollLock } from './command';
export { subscriptions } from './subscription';
export { view } from './page';

// UPDATE

const initialModel: Model = {
  isMenuOpen: false,
  activeSection: Option.none(),
  mapLeague: 'All',
  mapClub: Option.none(),
  isMapAreaImperial: true,
  heroPastHeader: false,
};

// Applies a parsed URL to the model — used for the initial load, our own
// navigation, and browser back/forward. Unknown paths fall back to the
// landing page.
const applyRoute = (model: Model, route: AppRoute): Model => {
  const next = M.value(route).pipe(
    M.withReturnType<Model>(),
    M.tagsExhaustive({
      HomeRoute: () => evo(model, { isMenuOpen: () => false }),
      NotFoundRoute: () => evo(model, { isMenuOpen: () => false }),
    }),
  );
  // Any navigation closes the map's club card — landing back on the page
  // with a stale card open would be odd.
  return evo(next, { mapClub: () => Option.none() });
};

export const init: Runtime.RoutingApplicationInit<Model, Message> = (url) => [
  applyRoute(initialModel, urlToAppRoute(url)),
  [],
];

// The pair returned by `update` (and by the nested match on link requests):
// the next model and the commands to run. Named once rather than spelled out
// at every withReturnType.
type UpdateReturn = readonly [Model, ReadonlyArray<Command.Command<Message>>];
const withUpdateReturn = M.withReturnType<UpdateReturn>();

export const update = (model: Model, message: Message): UpdateReturn =>
  M.value(message).pipe(
    withUpdateReturn,
    M.tagsExhaustive({
      ToggledMenu: () => {
        const isMenuOpen = !model.isMenuOpen;
        return [
          // Opening resets the marker to "unknown" so a stale highlight from
          // the previous open can't flash before detection lands.
          evo(model, {
            isMenuOpen: () => isMenuOpen,
            activeSection: (s) => (isMenuOpen ? Option.none() : s),
          }),
          isMenuOpen
            ? [SetScrollLock({ locked: true }), DetectActiveSection()]
            : [SetScrollLock({ locked: false })],
        ];
      },
      ClosedMenu: () => [
        evo(model, { isMenuOpen: () => false }),
        [SetScrollLock({ locked: false })],
      ],
      DetectedActiveSection: ({ section }) => [evo(model, { activeSection: () => section }), []],
      // In-app links (club pins, menu anchors, back links) apply their route
      // immediately and push the URL; external links load normally. Any
      // in-app navigation also closes the menu, so release the scroll lock.
      ClickedLink: ({ request }) =>
        M.value(request).pipe(
          withUpdateReturn,
          M.tagsExhaustive({
            Internal: ({ url }) => [
              applyRoute(model, urlToAppRoute(url)),
              [Navigate({ url: urlToString(url) }), SetScrollLock({ locked: false })],
            ],
            External: ({ href }) => [model, [Load({ href })]],
          }),
        ),
      // Browser back/forward — also releases the lock (the menu closes).
      ChangedUrl: ({ url }) => [
        applyRoute(model, urlToAppRoute(url)),
        [SetScrollLock({ locked: false })],
      ],
      CompletedNavigate: () => [model, []],
      CompletedLoad: () => [model, []],
      CompletedSetScrollLock: () => [model, []],
      SelectedMapLeague: ({ league }) => [
        evo(model, { mapLeague: () => league, mapClub: () => Option.none() }),
        [],
      ],
      OpenedMapClub: ({ slug }) => [evo(model, { mapClub: () => Option.some(slug) }), []],
      ClosedMapClub: () => [evo(model, { mapClub: () => Option.none() }), []],
      ToggledAreaUnit: () => [evo(model, { isMapAreaImperial: (imperial) => !imperial }), []],
      CompletedMountMotion: () => [model, []],
      // Motion is decorative — if it fails to attach, the page still renders
      // fully readable (reveal targets just stay at their resting state).
      FailedMountMotion: () => [model, []],
      // The hero observer reports whether it has scrolled under the header;
      // the header CTA renders off this flag.
      DetectedHeroPastHeader: ({ past }) => [evo(model, { heroPastHeader: () => past }), []],
    }),
  );

// CONTENT lives in data.ts now.
// SUBSCRIPTIONS live in subscription.ts now.

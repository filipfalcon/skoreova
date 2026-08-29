import { RadioGroup } from '@foldkit/ui';
import { Array, Option, Record } from 'effect';
import type { Runtime } from 'foldkit';
import { Update } from 'foldkit';
import { evo } from 'foldkit/struct';
import { UrlRequest } from 'foldkit/navigation';
import { toString as urlToString } from 'foldkit/url';
import type { Url } from 'foldkit/url';

import { AppRoute, urlToAppRoute } from './route';
import type { Model, RevealState } from './model';
import { Message } from './message';
import { MAP_LEAGUE_GROUP_ID, MapLeagueRadioGroup } from './radio-groups';
import { detectActiveSection, focusMenuToggle, load, navigate, setScrollLock } from './command';

// The app entry: init, the update reducer, and the re-exports that keep the
// public surface (Model, messages, subscriptions, view) at ./main.
export * from './model';
export * from './message';
export * from './command';
export { subscriptions } from './subscription';
export { view } from './view';

/**
 * How the runtime turns link clicks and history moves into Messages. Shared by the browser entry
 * and the server render so both boot the same application.
 */
export const routing = {
  onUrlRequest: (request: UrlRequest): Message => Message.ClickedLink({ request }),
  onUrlChange: (url: Url): Message => Message.ChangedUrl({ url }),
};

// UPDATE

const initialModel: Model = {
  route: AppRoute.Home(),
  isMenuOpen: false,
  activeSection: Option.none(),
  mapLeague: 'All',
  mapLeagueGroup: RadioGroup.init({ id: MAP_LEAGUE_GROUP_ID }),
  mapClub: Option.none(),
  isMapAreaImperial: true,
  heroPastHeader: false,
  prefersReducedMotion: false,
  reveals: {},
};

// Applies a parsed URL to the model — used for the initial load, our own
// navigation, and browser back/forward. Unknown paths fall back to the
// landing page.
const applyRoute = (model: Model, route: AppRoute): Model => {
  const next = AppRoute.match<Model>(route, {
    Home: () => evo(model, { isMenuOpen: () => false }),
    Policy: () => evo(model, { isMenuOpen: () => false }),
    NotFound: () => evo(model, { isMenuOpen: () => false }),
  });
  // Any navigation closes the map’s club card — landing back on the page
  // with a stale card open would be odd.
  return evo(next, { route: () => route, mapClub: () => Option.none() });
};

// No Flags: every screen derives from the URL, so the server knows everything
// the browser knows at render time and a hydrating client rebuilds the same
// Model from the same URL — no serialized handoff to keep honest. Reduced
// motion is the one thing the server cannot know, and the reducedMotion
// subscription reads it on the client instead of riding in here.
export const init: Runtime.RoutingApplicationInit<Model, Message> = (url) => ({
  model: applyRoute(initialModel, urlToAppRoute(url)),
});

export const update = (model: Model, message: Message) =>
  Message.match<Update.Return<Model, Message>>(message, {
    ToggledMenu: () => {
      const isMenuOpen = !model.isMenuOpen;
      return {
        // Opening resets the marker to "unknown" so a stale highlight from
        // the previous open can’t flash before detection lands.
        model: evo(model, {
          isMenuOpen: () => isMenuOpen,
          activeSection: (s) => (isMenuOpen ? Option.none() : s),
        }),
        commands: isMenuOpen
          ? [setScrollLock(true), detectActiveSection()]
          : [setScrollLock(false)],
      };
    },
    ClosedMenu: () => ({
      model: evo(model, { isMenuOpen: () => false }),
      commands: [setScrollLock(false)],
    }),
    // Escape closes like ClosedMenu and additionally hands focus back to
    // the toggle — the overlay it sat in is hidden now.
    PressedMenuEscape: () => ({
      model: evo(model, { isMenuOpen: () => false }),
      commands: [setScrollLock(false), focusMenuToggle()],
    }),
    CompletedFocusMenuToggle: () => ({ model }),
    DetectedActiveSection: ({ section }) => ({
      model: evo(model, { activeSection: () => section }),
    }),
    // In-app links (club pins, menu anchors, back links) apply their route
    // immediately and push the URL; external links load normally. Any
    // in-app navigation also closes the menu, so release the scroll lock.
    ClickedLink: ({ request }) =>
      UrlRequest.match<Update.Return<Model, Message>>(request, {
        Internal: ({ url }) => ({
          model: applyRoute(model, urlToAppRoute(url)),
          commands: [navigate(urlToString(url), model.prefersReducedMotion), setScrollLock(false)],
        }),
        External: ({ href }) => ({ model, commands: [load(href)] }),
      }),
    // Browser back/forward — also releases the lock (the menu closes).
    ChangedUrl: ({ url }) => ({
      model: applyRoute(model, urlToAppRoute(url)),
      commands: [setScrollLock(false)],
    }),
    CompletedNavigate: () => ({ model }),
    CompletedLoad: () => ({ model }),
    CompletedSetScrollLock: () => ({ model }),
    SelectedMapLeague: ({ league }) => ({
      model: evo(model, { mapLeague: () => league, mapClub: () => Option.none() }),
    }),
    GotMapLeagueGroupMessage: ({ message }) =>
      Update.foldChild({
        update: MapLeagueRadioGroup.update,
        read: (parent: Model) => Option.some(parent.mapLeagueGroup),
        write: (parent: Model, mapLeagueGroup) =>
          evo(parent, { mapLeagueGroup: () => mapLeagueGroup }),
        toParentMessage: (childMessage) =>
          Message.GotMapLeagueGroupMessage({ message: childMessage }),
        // Committing a league also drops the open club: the pin behind the
        // card can be filtered away by the very pick that commits.
        foldOutMessage:
          ({ value }) =>
          (parent: Model) => ({
            model: evo(parent, { mapLeague: () => value, mapClub: () => Option.none() }),
          }),
      })(message)(model),
    OpenedMapClub: ({ slug }) => ({
      model: evo(model, { mapClub: () => Option.some(slug) }),
    }),
    ClosedMapClub: () => ({ model: evo(model, { mapClub: () => Option.none() }) }),
    ToggledAreaUnit: () => ({
      model: evo(model, { isMapAreaImperial: (imperial) => !imperial }),
    }),
    CompletedMountMotion: () => ({ model }),
    // Motion is decorative — if it fails to attach, the page still renders
    // fully readable (reveal targets just stay at their resting state).
    FailedMountMotion: () => ({ model }),
    // The hero observer reports whether it has scrolled under the header;
    // the header CTA renders off this flag.
    DetectedHeroPastHeader: ({ past }) => ({
      model: evo(model, { heroPastHeader: () => past }),
    }),
    // The OS setting flipped mid-session — the keyed motion mount and the
    // wheel subscription both follow this flag. Reveal state resets: the
    // remounted observers re-report everything on-screen within a frame.
    ChangedReducedMotion: ({ reduce }) => ({
      model: evo(model, { prefersReducedMotion: () => reduce, reveals: () => ({}) }),
    }),
    // The reveal observers' report, and the only message that MOVES a
    // target between reveal states (ChangedReducedMotion above clears the
    // record wholesale, which is a reset, not a transition). `revealed`
    // never downgrades an already-drawn target; `drawn` only upgrades one
    // that is on screen.
    ChangedReveals: ({ revealed, concealed, drawn }) => ({
      model: evo(model, {
        reveals: (reveals) => {
          const kept = Record.filter(reveals, (_, key) => !Array.contains(concealed, key));
          // union keeps the LEFT value on a conflict, which is the
          // no-downgrade rule: a target already 'drawn' stays drawn when its
          // observer re-reports it as merely entered.
          const entered = Record.union(
            kept,
            Record.fromIterableWith(revealed, (key): readonly [string, RevealState] => [
              key,
              'entered',
            ]),
            (known) => known,
          );
          // Record.map only visits keys that are present, so a `drawn`
          // report for a target that has since left the screen is dropped
          // rather than resurrecting it.
          return Record.map(entered, (state, key) =>
            Array.contains(drawn, key) ? 'drawn' : state,
          );
        },
      }),
    }),
  });

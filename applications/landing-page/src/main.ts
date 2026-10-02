import { RadioGroup } from '@foldkit/ui';
import { Array, Option, Record } from 'effect';
import type { Runtime } from 'foldkit';
import { Update } from 'foldkit';
import { modifyFields } from 'foldkit/struct';
import { UrlRequest } from 'foldkit/navigation';
import { toString as urlToString } from 'foldkit/url';
import type { Url } from 'foldkit/url';

import { AppRoute, urlToAppRoute } from './route';
import { logoWords } from './data';
import type { Model, RevealState } from './model';
import { Message } from './message';
import { MAP_LEAGUE_GROUP_ID, MapLeagueRadioGroup } from './radio-groups';
import { detectActiveSection, focusMenuToggle, landOnLink, load, navigate } from './command';

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
  isLandingLink: false,
  mapLeagueGroup: RadioGroup.init({ id: MAP_LEAGUE_GROUP_ID }),
  mapClub: Option.none(),
  isMapAreaImperial: true,
  heroPastHeader: false,
  prefersReducedMotion: false,
  reveals: {},
  idleState: 'Active',
  shownLogoWord: Option.none(),
  nextLogoWord: 0,
};

// Applies a parsed URL to the model — used for the initial load, our own
// navigation, and browser back/forward. Unknown paths fall back to the
// landing page.
const applyRoute = (model: Model, route: AppRoute): Model => {
  const next = AppRoute.match<Model>(route, {
    Home: () => modifyFields(model, { isMenuOpen: () => false }),
    Policy: () => modifyFields(model, { isMenuOpen: () => false }),
    NotFound: () => modifyFields(model, { isMenuOpen: () => false }),
  });
  // Any navigation closes the map’s club card — landing back on the page
  // with a stale card open would be odd.
  return modifyFields(next, { route: () => route, mapClub: () => Option.none() });
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
        model: modifyFields(model, {
          isMenuOpen: () => isMenuOpen,
          activeSection: (s) => (isMenuOpen ? Option.none() : s),
        }),
        commands: isMenuOpen ? [detectActiveSection()] : [],
      };
    },
    ClosedMenu: () => ({
      model: modifyFields(model, { isMenuOpen: () => false }),
    }),
    // Escape closes whatever is up. The full-screen menu wins when open (it
    // covers the page) and hands focus back to the toggle, like a native
    // dialog returns focus to its opener — the overlay it sat in is hidden
    // now. Otherwise an open club card closes.
    PressedEscape: () => {
      if (model.isMenuOpen) {
        return {
          model: modifyFields(model, { isMenuOpen: () => false }),
          commands: [focusMenuToggle()],
        };
      }
      return { model: modifyFields(model, { mapClub: () => Option.none() }) };
    },
    CompletedFocusMenuToggle: () => ({ model }),
    DetectedActiveSection: ({ section }) => ({
      model: modifyFields(model, { activeSection: () => section }),
    }),
    // In-app links (club pins, menu anchors, back links) only push the URL;
    // the URL change that follows applies the route. External links load
    // normally.
    ClickedLink: ({ request }) =>
      UrlRequest.match<Update.Return<Model, Message>>(request, {
        Internal: ({ url }) => ({
          model: modifyFields(model, { isLandingLink: () => true }),
          commands: [navigate(urlToString(url))],
        }),
        External: ({ href }) => ({ model, commands: [load(href)] }),
      }),
    // Every URL change — a link's push or a back/forward traversal — applies
    // the route here, which also closes the menu. Only a link's lands the
    // reader on its target; a traversal keeps the browser's scroll restoration.
    ChangedUrl: ({ url }) => ({
      model: modifyFields(applyRoute(model, urlToAppRoute(url)), { isLandingLink: () => false }),
      commands: model.isLandingLink ? [landOnLink(url.hash, model.prefersReducedMotion)] : [],
    }),
    CompletedNavigate: () => ({ model }),
    CompletedLandOnLink: () => ({ model }),
    CompletedLoad: () => ({ model }),
    GotMapLeagueGroupMessage: ({ message }) =>
      Update.foldChild({
        update: MapLeagueRadioGroup.update,
        read: (parent: Model) => Option.some(parent.mapLeagueGroup),
        write: (parent: Model, mapLeagueGroup) =>
          modifyFields(parent, { mapLeagueGroup: () => mapLeagueGroup }),
        toParentMessage: (childMessage) =>
          Message.GotMapLeagueGroupMessage({ message: childMessage }),
        // Committing a league also drops the open club: the pin behind the
        // card can be filtered away by the very pick that commits.
        foldOutMessage:
          ({ value }) =>
          (parent: Model) => ({
            model: modifyFields(parent, { mapLeague: () => value, mapClub: () => Option.none() }),
          }),
      })(message)(model),
    OpenedMapClub: ({ slug }) => ({
      model: modifyFields(model, { mapClub: () => Option.some(slug) }),
    }),
    ClosedMapClub: () => ({ model: modifyFields(model, { mapClub: () => Option.none() }) }),
    ToggledAreaUnit: ({ isImperial }) => ({
      model: modifyFields(model, { isMapAreaImperial: () => isImperial }),
    }),
    CompletedMountMotion: () => ({ model }),
    // Motion is decorative — if it fails to attach, the page still renders
    // fully readable (reveal targets just stay at their resting state).
    FailedMountMotion: () => ({ model }),
    // The hero observer reports whether it has scrolled under the header;
    // the header CTA renders off this flag.
    DetectedHeroPastHeader: ({ past }) => ({
      model: modifyFields(model, { heroPastHeader: () => past }),
    }),
    // An idle turn shows the next word the header has room for, in the list's
    // order from the one due, cycling; where none fits, the turn passes with
    // the logo as it is. Only an idle reader between turns, or one just gone
    // idle, takes a turn.
    ReachedIdleTurn: ({ fitting }) => {
      if (model.idleState === 'Turn') return { model };
      const due = Array.findFirst(
        Array.makeBy(
          logoWords.length,
          (offset) => (model.nextLogoWord + offset) % logoWords.length,
        ),
        (index) => Array.contains(fitting, index),
      );
      return {
        model: modifyFields(model, {
          idleState: () => 'Turn' as const,
          shownLogoWord: () => due,
          nextLogoWord: (next) =>
            Option.match(due, {
              onNone: () => next,
              onSome: (index) => (index + 1) % logoWords.length,
            }),
        }),
      };
    },
    // The turn's 3 seconds ran out: the logo is itself for the rest of it.
    EndedIdleTurn: () =>
      model.idleState === 'Turn'
        ? {
            model: modifyFields(model, {
              idleState: () => 'Resting' as const,
              shownLogoWord: () => Option.none(),
            }),
          }
        : { model },
    // Activity ends a showing word at once, and starts the idle count afresh.
    ResumedActivity: () => ({
      model: modifyFields(model, {
        idleState: () => 'Active' as const,
        shownLogoWord: () => Option.none(),
      }),
    }),
    // The OS setting, on subscribe and on every flip. The view force-reveals
    // everything while it is set, and the wheel subscription follows it. The
    // motion mounts follow the query themselves; when motion comes back,
    // their rebuilt observers report every target's state afresh, so the
    // reveal record needs no reset here — a reset would race those reports.
    // Reduced motion also stops the logo's easter egg, a showing word included.
    ChangedReducedMotion: ({ reduce }) => ({
      model: modifyFields(model, {
        prefersReducedMotion: () => reduce,
        idleState: (state) => (reduce ? ('Active' as const) : state),
        shownLogoWord: (shown) => (reduce ? Option.none() : shown),
      }),
    }),
    // The reveal observers' report, and the only message that moves a
    // target between reveal states. `revealed`
    // never downgrades an already-drawn target; `drawn` only upgrades one
    // that is on screen.
    ChangedReveals: ({ revealed, concealed, drawn }) => ({
      model: modifyFields(model, {
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

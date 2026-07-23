import { Match as M, Option } from 'effect';
import type { Runtime } from 'foldkit';
import { Command } from 'foldkit';
import { evo } from 'foldkit/struct';
import { toString as urlToString } from 'foldkit/url';

import { AppRoute, WelcomeRoute, urlToAppRoute } from './route';
import { Metric, Model, Screen, ScorerScope } from './model';
import {
  ChangedUrl,
  ClickedLink,
  CompletedLoad,
  CompletedNavigate,
  CompletedWritePins,
  LoadedPins,
  Message,
  SelectedCompetitionEdition,
  SelectedCompetitionRound,
  SelectedFeaturedClub,
  SelectedMetric,
  SelectedScorerScope,
  ToggledFollow,
  ToggledPin,
  UpdatedClubQuery,
} from './message';
import { Load, Navigate, ReadPins, WritePins } from './command';

// MODEL, MESSAGE, COMMAND, DATA, and the SCREENS live in their own modules
// now (model.ts, message.ts, command.ts, domain/, data/, components.ts,
// page/*); this file wires them into init/update/view. Re-export the public
// surface so fixtures and tests can keep importing from the app entry.
export { Metric, Model, Screen, ScorerScope };

// MESSAGE — see message.ts.
export {
  ChangedUrl,
  ClickedLink,
  CompletedLoad,
  CompletedNavigate,
  CompletedWritePins,
  LoadedPins,
  Message,
  SelectedCompetitionEdition,
  SelectedCompetitionRound,
  SelectedFeaturedClub,
  SelectedMetric,
  SelectedScorerScope,
  ToggledFollow,
  ToggledPin,
  UpdatedClubQuery,
};

// COMMAND — see command.ts.
export { Load, Navigate, ReadPins, WritePins };

// UPDATE

const initialModel: Model = {
  route: WelcomeRoute(),
  competitionEdition: Option.none(),
  competitionRound: Option.none(),
  clubQuery: '',
  featuredClub: 0,
  followed: [],
  // Real value arrives from storage via ReadPins (init) — empty until then.
  pinned: [],
  scorerScope: 'All',
  metric: 'Goals',
};

// A route change stores the new route and resets the transient per-view state
// (the edition/round pickers, the clubs search, the carousel index). Opening a
// club also resets the top-scorers scope; other routes leave it alone.
const applyRoute = (model: Model, route: AppRoute): Model =>
  evo(model, {
    route: () => route,
    competitionEdition: () => Option.none(),
    competitionRound: () => Option.none(),
    clubQuery: () => '',
    featuredClub: () => 0,
    scorerScope: (current) => (route._tag === 'ClubRoute' ? 'All' : current),
  });

export const init: Runtime.RoutingApplicationInit<Model, Message> = (url) => [
  applyRoute(initialModel, urlToAppRoute(url)),
  // Hydrate pins from storage on boot. Any pin toggle before this resolves
  // is fine — ReadPins only seeds the initial list, it never clobbers a
  // later one (localStorage is synchronous, so this lands on the first tick
  // anyway).
  [ReadPins()],
];

// The pair returned by `update` (and by the nested match on link requests):
// the next model and the commands to run. Extracted so the shape is named
// once rather than spelled out at every `withReturnType`.
type UpdateReturn = readonly [Model, ReadonlyArray<Command.Command<Message>>];
const withUpdateReturn = M.withReturnType<UpdateReturn>();

export const update = (model: Model, message: Message): UpdateReturn =>
  M.value(message).pipe(
    withUpdateReturn,
    M.tagsExhaustive({
      ClickedLink: ({ request }) =>
        M.value(request).pipe(
          withUpdateReturn,
          M.tagsExhaustive({
            Internal: ({ url }) => [
              applyRoute(model, urlToAppRoute(url)),
              [Navigate({ url: urlToString(url) })],
            ],
            External: ({ href }) => [model, [Load({ href })]],
          }),
        ),
      ChangedUrl: ({ url }) => [applyRoute(model, urlToAppRoute(url)), []],
      CompletedNavigate: () => [model, []],
      CompletedLoad: () => [model, []],
      SelectedMetric: ({ metric }) => [evo(model, { metric: () => metric }), []],
      SelectedScorerScope: ({ scope }) => [evo(model, { scorerScope: () => scope }), []],
      // The chip sends '' for the current edition and 0 for the current
      // matchday; the Model holds None for "current" so the sentinel never
      // lives in the state.
      SelectedCompetitionEdition: ({ label }) => [
        evo(model, {
          competitionEdition: () => (label === '' ? Option.none() : Option.some(label)),
        }),
        [],
      ],
      SelectedCompetitionRound: ({ round }) => [
        evo(model, {
          competitionRound: () => (round === 0 ? Option.none() : Option.some(round)),
        }),
        [],
      ],
      UpdatedClubQuery: ({ query }) => [evo(model, { clubQuery: () => query }), []],
      SelectedFeaturedClub: ({ index }) => [evo(model, { featuredClub: () => index }), []],
      ToggledFollow: ({ slug }) => [
        evo(model, {
          followed: (followed) =>
            followed.includes(slug)
              ? followed.filter((entry) => entry !== slug)
              : [...followed, slug],
        }),
        [],
      ],
      LoadedPins: ({ ids }) => [evo(model, { pinned: () => [...ids] }), []],
      ToggledPin: ({ id }) => {
        const pinned = model.pinned.includes(id)
          ? model.pinned.filter((entry) => entry !== id)
          : [...model.pinned, id];
        // Update the model AND mirror it out in one step — the write is a
        // command so the reducer stays pure and testable.
        return [evo(model, { pinned: () => pinned }), [WritePins({ ids: pinned })]];
      },
      CompletedWritePins: () => [model, []],
    }),
  );

// DATA — all placeholder while the platform wires up.

// SCREENS and the view composition live in page.ts.
export { view } from './page';

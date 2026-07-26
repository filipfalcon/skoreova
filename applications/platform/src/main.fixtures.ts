import { Option } from 'effect';

import { Model } from './main';
import { ClubsRoute, CompetitionRoute, HerGameRoute, WelcomeRoute } from './route';

// The boot model — mirrors `initialModel` in main.ts (kept here so a fixture
// tweak can never quietly reshape the app’s real starting state). Every screen
// derives from this by spreading over the route (and any other differing
// field).
export const welcomeModel = Model.make({
  route: WelcomeRoute(),
  competitionEdition: Option.none(),
  competitionRounds: {},
  clubQuery: '',
  featuredClub: 0,
  followed: [],
  pinned: [],
  scorerScope: 'All',
  metric: 'Goals',
});

export const herGameModel = Model.make({ ...welcomeModel, route: HerGameRoute() });

// A Her Game feed with one board already pinned — exercises the pinned-tile
// branch of the view (empty vs populated).
export const herGamePinnedModel = Model.make({
  ...welcomeModel,
  route: HerGameRoute(),
  pinned: ['trending:sparta-praha'],
});

export const clubsModel = Model.make({ ...welcomeModel, route: ClubsRoute() });

// The First League’s profile with its round pager parked on matchday 1 — the
// only model where an end-stop is blocked, which is the state Ui.Button owns
// (aria-disabled, no click handler, still focusable).
export const competitionFirstRoundModel = Model.make({
  ...welcomeModel,
  route: CompetitionRoute({ slug: 'first-league' }),
  competitionRounds: { 'first-league': 1 },
});

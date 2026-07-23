import { Option } from 'effect';

import { Model } from './main';
import { ClubsRoute, HerGameRoute, WelcomeRoute } from './route';

// The boot model — mirrors `initialModel` in main.ts (kept here so a fixture
// tweak can never quietly reshape the app's real starting state). Every screen
// derives from this by spreading over the route (and any other differing
// field).
export const welcomeModel = Model.make({
  route: WelcomeRoute(),
  competitionEdition: Option.none(),
  competitionRound: Option.none(),
  clubQuery: '',
  featuredClub: 0,
  followed: [],
  pinned: [],
  scorerScope: 'all',
  metric: 'goals',
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

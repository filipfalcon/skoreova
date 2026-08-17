import { Option } from 'effect';

import { Model } from './main';
import { DEFAULT_FEED_BLOCKS } from './model';
import { ClubRoute, ClubsRoute, CompetitionRoute, HerGameRoute, WelcomeRoute } from './route';

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
  isSignedIn: false,
  feedBlocks: DEFAULT_FEED_BLOCKS,
  isFeedEditing: false,
  isFeedUnpinRefused: false,
});

// The feed mid-manage, where every block it carries is offering to leave.
export const feedEditingModel = Model.make({ ...welcomeModel, isFeedEditing: true });

// A feed the reader has emptied — the branch where the frame has to say so
// rather than stand open.
export const feedEmptyModel = Model.make({ ...welcomeModel, feedBlocks: [] });

// The refusal the widget block answers a signed-out unpin with.
export const feedRefusedModel = Model.make({
  ...welcomeModel,
  isFeedEditing: true,
  isFeedUnpinRefused: true,
});

export const herGameModel = Model.make({ ...welcomeModel, route: HerGameRoute() });

// The root as a SIGNED-IN visitor sees it — the same route as `welcomeModel`,
// the other half of the same page.
export const signedInModel = Model.make({ ...welcomeModel, isSignedIn: true });

// A Her Game feed with one board already pinned — exercises the pinned-tile
// branch of the view (empty vs populated).
export const herGamePinnedModel = Model.make({
  ...welcomeModel,
  route: HerGameRoute(),
  pinned: ['trending:sparta-praha'],
});

export const clubsModel = Model.make({ ...welcomeModel, route: ClubsRoute() });

// The richest club profile — hero artwork, honors, Europe, the cup run —
// so a render of it walks every section the profile can grow.
export const clubProfileModel = Model.make({
  ...welcomeModel,
  route: ClubRoute({ slug: 'sparta-praha' }),
});

// The First League’s profile with its round pager parked on matchday 1 — the
// only model where an end-stop is blocked, which is the state Ui.Button owns
// (aria-disabled, no click handler, still focusable).
export const competitionFirstRoundModel = Model.make({
  ...welcomeModel,
  route: CompetitionRoute({ slug: 'first-league' }),
  competitionRounds: { 'first-league': 1 },
});

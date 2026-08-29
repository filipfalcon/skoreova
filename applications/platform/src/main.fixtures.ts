import { RadioGroup } from '@foldkit/ui';
import { Option } from 'effect';

import { Model } from './main';
import { DEFAULT_FEED_BLOCKS, DEFAULT_NEXT_FEED_KEY, feedKey } from './model';
import { AppRoute } from './route';
import { EDITION_GROUP_ID, SCOPE_GROUP_ID } from './radio-groups';
import { FEED_FEATURED_MATCHES, FEED_LABEL } from './widgets';

// The boot model — mirrors `initialModel` in main.ts (kept here so a fixture
// tweak can never quietly reshape the app’s real starting state). Every screen
// derives from this by spreading over the route (and any other differing
// field).
export const welcomeModel = Model.make({
  route: AppRoute.Welcome(),
  competitionEdition: Option.none(),
  competitionRounds: {},
  clubQuery: '',
  featuredClub: 0,
  followed: [],
  pinned: [],
  scorerScope: 'All',
  scopeGroup: RadioGroup.init({ id: SCOPE_GROUP_ID }),
  editionGroup: RadioGroup.init({ id: EDITION_GROUP_ID }),
  metric: 'Goals',
  isSignedIn: false,
  feedBlocks: DEFAULT_FEED_BLOCKS,
  isFeedEditing: false,
  isWidgetCatalogOpen: false,
  isWidgetAddRefused: false,
  nextFeedKey: DEFAULT_NEXT_FEED_KEY,
});

// The feed mid-manage, where every block it carries is offering to leave.
export const feedEditingModel = Model.make({ ...welcomeModel, isFeedEditing: true });

// A feed the reader has emptied — the branch where the frame has to say so
// rather than stand open.
export const feedEmptyModel = Model.make({ ...welcomeModel, feedBlocks: [] });

// The catalog open on a signed-out feed, which is the state that carries the
// whole offer at once.
export const widgetCatalogModel = Model.make({ ...welcomeModel, isWidgetCatalogOpen: true });

// The refusal a pick answers with once a signed-out feed is full.
export const feedRefusedModel = Model.make({
  ...welcomeModel,
  isWidgetCatalogOpen: true,
  isWidgetAddRefused: true,
});

// A feed carrying the same widget twice and a standalone heading, which is the
// shape that proves a block is an instance and not a singleton — taking one
// out has to leave its twin where it is. Signed OUT, because the feed is drawn
// by the landing half of `/` and by nothing else: a signed-in model renders a
// page with no feed on it at all.
export const feedLabelledModel = Model.make({
  ...welcomeModel,
  feedBlocks: [
    { kind: FEED_LABEL, key: feedKey(7), label: Option.some('My clubs') },
    ...DEFAULT_FEED_BLOCKS,
    { kind: FEED_FEATURED_MATCHES, key: feedKey(8), label: Option.some('Cup week') },
  ],
  nextFeedKey: 9,
});

// A widget whose heading the reader has taken away, and a standalone heading
// they have blanked — the two states that look alike and are not.
export const feedHeadlessModel = Model.make({
  ...welcomeModel,
  feedBlocks: [
    { kind: FEED_FEATURED_MATCHES, key: feedKey(7), label: Option.none() },
    { kind: FEED_LABEL, key: feedKey(8), label: Option.some('') },
  ],
  nextFeedKey: 9,
});

// A signed-out feed filled to its widget allowance, which is where the offer
// of an account actually bites.
export const feedCappedModel = Model.make({
  ...welcomeModel,
  feedBlocks: [
    { kind: FEED_FEATURED_MATCHES, key: feedKey(1), label: Option.some('Featured matches') },
    { kind: FEED_FEATURED_MATCHES, key: feedKey(2), label: Option.some('Cup week') },
    { kind: FEED_FEATURED_MATCHES, key: feedKey(3), label: Option.some('Europe') },
  ],
  nextFeedKey: 4,
});

export const herGameModel = Model.make({ ...welcomeModel, route: AppRoute.HerGame() });

// The root as a SIGNED-IN visitor sees it — the same route as `welcomeModel`,
// the other half of the same page.
export const signedInModel = Model.make({ ...welcomeModel, isSignedIn: true });

// A Her Game feed with one board already pinned — exercises the pinned-tile
// branch of the view (empty vs populated).
export const herGamePinnedModel = Model.make({
  ...welcomeModel,
  route: AppRoute.HerGame(),
  pinned: ['trending:sparta-praha'],
});

export const clubsModel = Model.make({ ...welcomeModel, route: AppRoute.Clubs() });

// The richest club profile — hero artwork, honors, Europe, the cup run —
// so a render of it walks every section the profile can grow.
export const clubProfileModel = Model.make({
  ...welcomeModel,
  route: AppRoute.Club({ slug: 'sparta-praha' }),
});

// The First League’s profile with its round pager parked on matchday 1 — the
// only model where an end-stop is blocked, which is the state Ui.Button owns
// (aria-disabled, no click handler, still focusable).
export const competitionFirstRoundModel = Model.make({
  ...welcomeModel,
  route: AppRoute.Competition({ slug: 'first-league' }),
  competitionRounds: { 'first-league': 1 },
});

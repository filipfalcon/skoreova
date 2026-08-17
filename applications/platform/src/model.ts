import { Schema as S } from 'effect';

import { AppRoute } from './route';

// A MOCK of the platform: the shell, the navigation, and every screen are
// real Foldkit views, but all data is hardcoded placeholder. There is NO
// account gate — the platform’s free plan is open to everyone, so every
// deep link from the landing page drops straight onto content. The model
// carries the route and nothing but the state the route can’t express: the
// per-screen pickers, the clubs search, and the two lists a visitor builds
// by tapping (followed clubs, pinned boards).

export const Screen = S.Literals([
  'Welcome',
  'HerGame',
  'Clubs',
  'Players',
  'Matches',
  'Competitions',
  'Officials',
]);
export type Screen = typeof Screen.Type;

export const Metric = S.Literals(['Goals', 'Attendance', 'Conversion']);
export type Metric = typeof Metric.Type;

// Which competition the club profile’s TOP SCORERS board shows — one
// component, scoped by chips (user call).
export const ScorerScope = S.Literals(['All', 'League', 'Cup']);
export type ScorerScope = typeof ScorerScope.Type;

export const Model = S.Struct({
  // The current route is THE source of truth for what’s on screen — the
  // visible screen and any open club/competition slug are derived from it in
  // the view (see screenOf / routeClubSlug / routeCompetitionSlug), so the
  // impossible states a screen+slug pair allowed (a slug set on the wrong
  // screen, both slugs at once) can’t be represented.
  route: AppRoute,
  // Which of the open competition’s EDITIONS is showing (None = the current
  // one). Every competition is a series of editions — one per season — and
  // the profile carries a picker; the backend exposes them via
  // /editions?competitionId= once real data lands.
  competitionEdition: S.Option(S.String),
  // Which matchday each competition’s matches panel shows, keyed by the
  // competition slug (a missing key = that competition’s current matchday).
  // Keyed rather than one shared field because /matches renders BOTH league
  // panels at once: a single round made them page in lockstep, and it could
  // only ever be clamped against whatever competition the route had open —
  // which on /matches is none, so every pick collapsed to round 1.
  competitionRounds: S.Record(S.String, S.Number),
  // The clubs directory’s search box ('' = show everything).
  clubQuery: S.String,
  // Which of the featured EUROPEAN CONTENDERS the clubs carousel shows.
  featuredClub: S.Number,
  // Slugs of the clubs the visitor follows (mock — session only; feeds
  // HER GAME once the real accounts land).
  followed: S.Array(S.String),
  // Ids of the boards and charts pinned to HER GAME. Unlike `followed`
  // this DOES survive a reload — it is mirrored to storage through the
  // pins port (see `pinsStore`). Seeded from storage by the ReadPins
  // command fired in `init`.
  pinned: S.Array(S.String),
  scorerScope: ScorerScope,
  metric: Metric,
  // Whether the visitor is SIGNED IN, which is the whole of what makes `/`
  // two pages: signed out it is the landing, signed in it is Her Game. No
  // message sets this yet, so it holds its initial value until accounts land
  // and the signed-in half is reachable from the fixtures.
  isSignedIn: S.Boolean,
  // The blocks the feed is carrying. Mock — session only, and deliberately
  // NOT the `pinned` array above: that one is replaced wholesale by whatever
  // storage returns, which on a first visit is nothing, and a feed that opens
  // empty for every new reader is not a feed.
  feedBlocks: S.Array(S.String),
  // Whether the feed is in its MANAGE state, where every block it carries
  // offers to leave. Transient: a route change drops it, so nobody returns to
  // the page still holding a screwdriver.
  isFeedEditing: S.Boolean,
  // Set when the reader tries to take out a block that will not leave without
  // an account. Cleared whenever the manage state is thrown, so a refusal
  // never outlives the state that produced it.
  isFeedUnpinRefused: S.Boolean,
});
export type Model = typeof Model.Type;

// The blocks a feed can carry. Ids rather than union members so a block can
// join or leave the feed without the model's type moving.
export const FEED_ADD_WIDGET = 'feed:add-a-widget';
export const FEED_FEATURED_MATCHES = 'feed:featured-matches';

// What a feed opens with before the reader has taken anything out of it. The
// widget block leads, and unlike the rest it does not leave — see
// `isUnpinnableWithoutAccount`.
export const DEFAULT_FEED_BLOCKS: ReadonlyArray<string> = [FEED_ADD_WIDGET, FEED_FEATURED_MATCHES];

// Whether a block refuses to leave a signed-out feed. Adding a widget is the
// one thing in the feed that needs somewhere to save the result, so it is the
// one block an account gates.
export const isUnpinnableWithoutAccount = (id: string): boolean => id !== FEED_ADD_WIDGET;

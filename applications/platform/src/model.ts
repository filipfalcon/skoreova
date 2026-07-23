import { Schema as S } from 'effect';

import { AppRoute } from './route';

// A MOCK of the platform: the shell, the navigation, and every screen are
// real Foldkit views, but all data is hardcoded placeholder. There is NO
// account gate — the platform's free plan is open to everyone, so every
// deep link from the landing page drops straight onto content. The model
// only tracks what the mock genuinely needs — the open screen, the open
// profile (if any), the mobile menu, and the chart studio's selected metric.

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

// Which competition the club profile's TOP SCORERS board shows — one
// component, scoped by chips (user call).
export const ScorerScope = S.Literals(['All', 'League', 'Cup']);
export type ScorerScope = typeof ScorerScope.Type;

export const Model = S.Struct({
  // The current route is THE source of truth for what's on screen — the
  // visible screen and any open club/competition slug are derived from it in
  // the view (see screenOf / routeClubSlug / routeCompetitionSlug), so the
  // impossible states a screen+slug pair allowed (a slug set on the wrong
  // screen, both slugs at once) can't be represented.
  route: AppRoute,
  // Which of the open competition's EDITIONS is showing (None = the current
  // one). Every competition is a series of editions — one per season — and
  // the profile carries a picker; the backend exposes them via
  // /editions?competitionId= once real data lands.
  competitionEdition: S.Option(S.String),
  // Which matchday the competition profile's matches panel shows (None = the
  // current one).
  competitionRound: S.Option(S.Number),
  // The clubs directory's search box ('' = show everything).
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
});
export type Model = typeof Model.Type;

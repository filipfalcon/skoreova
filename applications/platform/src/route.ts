import { Schema as S, pipe } from 'effect';
import {
  defineRouteUnion,
  literal,
  mapTo,
  oneOf,
  parseUrlWithFallback,
  query,
  root,
  slash,
  string,
} from 'foldkit/route';

// The platform’s top-level sections, plus the two profile routes migrated
// from the landing page: `/clubs/<slug>` and `/competitions/<slug>`. The
// remaining entity profiles (players, officials…) get their slug routes once
// real data lands — for the mock, each directory is a single screen.
//
// - Welcome is the platform’s HOME at `/` — the former welcome and dashboard
//   screens merged into one (the brand wordmark also lands here).
// - HerGame is HER GAME — the platform’s personal section (the former charts
//   screen); the custom follow-feed lands here later.
// - Club and Competition are one entity’s profile page each.
// - Officials is not in the top nav — reachable from the home browse tiles
//   and by URL.
export const AppRoute = defineRouteUnion({
  Welcome: {},
  HerGame: {},
  Clubs: {},
  Club: { slug: S.String },
  Players: {},
  // `club` narrows the schedule to one club's season; absent, every league shows. A query rather than a path segment because it is a filter on the one matches screen, not a second screen — `/matches?club=sparta-praha` is the same page, narrowed.
  Matches: { club: S.optionalKey(S.String) },
  Competitions: {},
  Competition: { slug: S.String },
  Officials: {},
  NotFound: { path: S.String },
});
export type AppRoute = typeof AppRoute.Type;

export const welcomeRouter = pipe(root, mapTo(AppRoute.Welcome));
export const herGameRouter = pipe(literal('her-game'), mapTo(AppRoute.HerGame));
export const clubsRouter = pipe(literal('clubs'), mapTo(AppRoute.Clubs));
export const clubRouter = pipe(literal('clubs'), slash(string('slug')), mapTo(AppRoute.Club));
export const playersRouter = pipe(literal('players'), mapTo(AppRoute.Players));
export const matchesRouter = pipe(
  literal('matches'),
  query(S.Struct({ club: S.optionalKey(S.String) })),
  mapTo(AppRoute.Matches),
);
export const competitionsRouter = pipe(literal('competitions'), mapTo(AppRoute.Competitions));
export const competitionRouter = pipe(
  literal('competitions'),
  slash(string('slug')),
  mapTo(AppRoute.Competition),
);
export const officialsRouter = pipe(literal('officials'), mapTo(AppRoute.Officials));

const routeParser = oneOf(
  herGameRouter,
  clubRouter,
  clubsRouter,
  playersRouter,
  matchesRouter,
  competitionRouter,
  competitionsRouter,
  officialsRouter,
  welcomeRouter,
);

export const urlToAppRoute = parseUrlWithFallback(routeParser, AppRoute.NotFound);

/**
 * The path a route names, which is the same path its router parses. The routers run both ways, so a
 * route that changes shape carries its canonical URL with it rather than leaving a second spelling
 * to drift.
 *
 * A not-found route answers with the path that produced it, so the document a 404 serves still
 * names what was asked for.
 *
 * @param route The route to name.
 */
export const routePath = (route: AppRoute): string =>
  AppRoute.match<string>(route, {
    Welcome: () => welcomeRouter(),
    HerGame: () => herGameRouter(),
    Clubs: () => clubsRouter(),
    Club: ({ slug }) => clubRouter({ slug }),
    Players: () => playersRouter(),
    Matches: ({ club }) => matchesRouter(club === undefined ? {} : { club }),
    Competitions: () => competitionsRouter(),
    Competition: ({ slug }) => competitionRouter({ slug }),
    Officials: () => officialsRouter(),
    NotFound: ({ path }) => path,
  });

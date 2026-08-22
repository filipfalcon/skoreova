import { Match as M, Schema as S, pipe } from 'effect';
import { literal, mapTo, oneOf, parseUrlWithFallback, r, root, slash, string } from 'foldkit/route';

// The platform’s top-level sections, plus the two profile routes migrated
// from the landing page: `/clubs/<slug>` and `/competitions/<slug>`. The
// remaining entity profiles (players, officials…) get their slug routes once
// real data lands — for the mock, each directory is a single screen.
// The platform’s HOME at `/` — the former welcome and dashboard screens
// merged into one (the brand wordmark also lands here).
export const WelcomeRoute = r('WelcomeRoute');
// HER GAME — the platform’s personal section (the former charts screen);
// the custom follow-feed lands here later.
export const HerGameRoute = r('HerGameRoute');
export const ClubsRoute = r('ClubsRoute');
// One club’s profile page.
export const ClubRoute = r('ClubRoute', { slug: S.String });
export const PlayersRoute = r('PlayersRoute');
export const MatchesRoute = r('MatchesRoute');
export const CompetitionsRoute = r('CompetitionsRoute');
// One competition’s profile page.
export const CompetitionRoute = r('CompetitionRoute', { slug: S.String });
// Not in the top nav — reachable from the home browse tiles and by URL.
export const OfficialsRoute = r('OfficialsRoute');
export const NotFoundRoute = r('NotFoundRoute', { path: S.String });

export const AppRoute = S.Union([
  WelcomeRoute,
  HerGameRoute,
  ClubsRoute,
  ClubRoute,
  PlayersRoute,
  MatchesRoute,
  CompetitionsRoute,
  CompetitionRoute,
  OfficialsRoute,
  NotFoundRoute,
]);
export type AppRoute = typeof AppRoute.Type;

export const welcomeRouter = pipe(root, mapTo(WelcomeRoute));
export const herGameRouter = pipe(literal('her-game'), mapTo(HerGameRoute));
export const clubsRouter = pipe(literal('clubs'), mapTo(ClubsRoute));
export const clubRouter = pipe(literal('clubs'), slash(string('slug')), mapTo(ClubRoute));
export const playersRouter = pipe(literal('players'), mapTo(PlayersRoute));
export const matchesRouter = pipe(literal('matches'), mapTo(MatchesRoute));
export const competitionsRouter = pipe(literal('competitions'), mapTo(CompetitionsRoute));
export const competitionRouter = pipe(
  literal('competitions'),
  slash(string('slug')),
  mapTo(CompetitionRoute),
);
export const officialsRouter = pipe(literal('officials'), mapTo(OfficialsRoute));

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

export const urlToAppRoute = parseUrlWithFallback(routeParser, NotFoundRoute);

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
  M.value(route).pipe(
    M.withReturnType<string>(),
    M.tag('WelcomeRoute', () => welcomeRouter()),
    M.tag('HerGameRoute', () => herGameRouter()),
    M.tag('ClubsRoute', () => clubsRouter()),
    M.tag('ClubRoute', ({ slug }) => clubRouter({ slug })),
    M.tag('PlayersRoute', () => playersRouter()),
    M.tag('MatchesRoute', () => matchesRouter()),
    M.tag('CompetitionsRoute', () => competitionsRouter()),
    M.tag('CompetitionRoute', ({ slug }) => competitionRouter({ slug })),
    M.tag('OfficialsRoute', () => officialsRouter()),
    M.tag('NotFoundRoute', ({ path }) => path),
    M.exhaustive,
  );

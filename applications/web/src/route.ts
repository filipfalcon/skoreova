import { Schema as S, pipe } from 'effect';
import { literal, mapTo, oneOf, parseUrlWithFallback, r, root, slash, string } from 'foldkit/route';

export const HomeRoute = r('HomeRoute');
// `/clubs/<slug>` — one club's profile page.
export const ClubRoute = r('ClubRoute', { slug: S.String });
// `/competitions/<slug>` — one competition's profile page.
export const CompetitionRoute = r('CompetitionRoute', { slug: S.String });
export const NotFoundRoute = r('NotFoundRoute', { path: S.String });

export const AppRoute = S.Union([HomeRoute, ClubRoute, CompetitionRoute, NotFoundRoute]);
export type HomeRoute = typeof HomeRoute.Type;
export type ClubRoute = typeof ClubRoute.Type;
export type CompetitionRoute = typeof CompetitionRoute.Type;
export type NotFoundRoute = typeof NotFoundRoute.Type;
export type AppRoute = typeof AppRoute.Type;

export const homeRouter = pipe(root, mapTo(HomeRoute));
export const clubRouter = pipe(literal('clubs'), slash(string('slug')), mapTo(ClubRoute));
export const competitionRouter = pipe(
  literal('competitions'),
  slash(string('slug')),
  mapTo(CompetitionRoute),
);

const routeParser = oneOf(clubRouter, competitionRouter, homeRouter);

export const urlToAppRoute = parseUrlWithFallback(routeParser, NotFoundRoute);

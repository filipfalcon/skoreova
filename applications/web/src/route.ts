import { Schema as S, pipe } from 'effect';
import { mapTo, oneOf, parseUrlWithFallback, r, root } from 'foldkit/route';

// The web app is the landing page and nothing else — club and competition
// profiles live on the platform now.
export const HomeRoute = r('HomeRoute');
export const NotFoundRoute = r('NotFoundRoute', { path: S.String });

export const AppRoute = S.Union([HomeRoute, NotFoundRoute]);
export type HomeRoute = typeof HomeRoute.Type;
export type NotFoundRoute = typeof NotFoundRoute.Type;
export type AppRoute = typeof AppRoute.Type;

export const homeRouter = pipe(root, mapTo(HomeRoute));

const routeParser = oneOf(homeRouter);

export const urlToAppRoute = parseUrlWithFallback(routeParser, NotFoundRoute);

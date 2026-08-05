import { Schema as S, pipe } from 'effect';
import { literal, mapTo, oneOf, parseUrlWithFallback, r, root } from 'foldkit/route';

// The web app is the landing page and nothing else — club and competition
// profiles live on the platform now.
export const HomeRoute = r('HomeRoute');
// The consent banner's "Learn more" target: what the two measurement tools
// do, in plain words. The banner markup in index.html links it by path.
export const PolicyRoute = r('PolicyRoute');
export const NotFoundRoute = r('NotFoundRoute', { path: S.String });

export const AppRoute = S.Union([HomeRoute, PolicyRoute, NotFoundRoute]);
export type HomeRoute = typeof HomeRoute.Type;
export type PolicyRoute = typeof PolicyRoute.Type;
export type NotFoundRoute = typeof NotFoundRoute.Type;
export type AppRoute = typeof AppRoute.Type;

export const homeRouter = pipe(root, mapTo(HomeRoute));
export const policyRouter = pipe(literal('policy'), mapTo(PolicyRoute));

const routeParser = oneOf(homeRouter, policyRouter);

export const urlToAppRoute = parseUrlWithFallback(routeParser, NotFoundRoute);

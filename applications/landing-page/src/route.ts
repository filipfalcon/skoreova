import { Schema as S, pipe } from 'effect';
import { defineRouteUnion, literal, mapTo, oneOf, parseUrlWithFallback, root } from 'foldkit/route';

// The web app is the landing page and nothing else — club and competition
// profiles live on the platform now.
//
// Policy is the consent banner's "Learn more" target: what the two measurement
// tools do, in plain words. The banner markup in index.html links it by path.
export const AppRoute = defineRouteUnion({
  Home: {},
  Policy: {},
  NotFound: { path: S.String },
});
export type AppRoute = typeof AppRoute.Type;

export const homeRouter = pipe(root, mapTo(AppRoute.Home));
export const policyRouter = pipe(literal('policy'), mapTo(AppRoute.Policy));

const routeParser = oneOf(homeRouter, policyRouter);

export const urlToAppRoute = parseUrlWithFallback(routeParser, AppRoute.NotFound);

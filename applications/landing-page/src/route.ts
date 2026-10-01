import { Schema, pipe } from 'effect';
import { defineRouteUnion, literal, mapTo, oneOf, parseUrlWithFallback, root } from 'foldkit/route';

// The web app is the landing page and nothing else — club and competition
// profiles live on the platform now.
//
// Policy is the consent banner's "Learn more" target: what the two measurement
// tools do, in plain words. The banner markup in index.html links it by path.
export const AppRoute = defineRouteUnion({
  Home: {},
  Policy: {},
  NotFound: { path: Schema.String },
});
export type AppRoute = typeof AppRoute.Type;

export const homeRouter = pipe(root, mapTo(AppRoute.Home));
export const policyRouter = pipe(literal('policy'), mapTo(AppRoute.Policy));

const routeParser = oneOf(homeRouter, policyRouter);

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
    Home: () => homeRouter(),
    Policy: () => policyRouter(),
    NotFound: ({ path }) => path,
  });

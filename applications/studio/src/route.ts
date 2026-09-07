import { Option, Schema, pipe } from 'effect';
import {
  defineRouteUnion,
  mapTo,
  oneOf,
  parseUrlWithFallback,
  root,
  schemaSegment,
  slash,
  string,
} from 'foldkit/route';

import { Section } from './section';

// - Section is `/<section>` — a section’s list, e.g. /players or /clubs.
// - Record is `/<section>/<id>` — one record’s drawer open, addressed by its
//   server id. Only Clubs/Nationals can be resolved by id when they aren’t
//   loaded yet (GET /teams/{id}); every other section’s deep link falls back
//   to the section list — see applyRoute’s Record branch in main.ts.
export const AppRoute = defineRouteUnion({
  Home: {},
  Section: { section: Section },
  Record: { section: Section, id: Schema.String },
  NotFound: { path: Schema.String },
});
export type AppRoute = typeof AppRoute.Type;

export const homeRouter = pipe(root, mapTo(AppRoute.Home));
export const sectionRouter = pipe(schemaSegment('section', Section), mapTo(AppRoute.Section));
export const recordRouter = pipe(
  schemaSegment('section', Section),
  slash(string('id')),
  mapTo(AppRoute.Record),
);

const routeParser = oneOf(recordRouter, sectionRouter, homeRouter);

export const urlToAppRoute = parseUrlWithFallback(routeParser, AppRoute.NotFound);

// The section a route addresses, or None on the dashboard landing page (and
// the 404 fallback, which renders it). What’s on screen is derived from the
// stored route through this — there is no separate section/dashboard flag to
// keep in sync.
export const routeSection = (route: AppRoute): Option.Option<Section> =>
  route._tag === 'Section' || route._tag === 'Record' ? Option.some(route.section) : Option.none();

import { Schema as S, pipe } from 'effect';
import {
  mapTo,
  oneOf,
  parseUrlWithFallback,
  r,
  root,
  schemaSegment,
  slash,
  string,
} from 'foldkit/route';

import { Section } from './section';

export const HomeRoute = r('HomeRoute');
// `/<section>` — a section's list, e.g. /players or /clubs.
export const SectionRoute = r('SectionRoute', { section: Section });
// `/<section>/<id>` — one record's drawer open, addressed by its server id.
// Only Players/Clubs/Nationals have real ids; other sections' records can't
// be deep-linked yet (see FetchTeamById and its comment in main.ts).
export const RecordRoute = r('RecordRoute', { section: Section, id: S.String });
export const NotFoundRoute = r('NotFoundRoute', { path: S.String });

export const AppRoute = S.Union([HomeRoute, RecordRoute, SectionRoute, NotFoundRoute]);
export type HomeRoute = typeof HomeRoute.Type;
export type SectionRoute = typeof SectionRoute.Type;
export type RecordRoute = typeof RecordRoute.Type;
export type NotFoundRoute = typeof NotFoundRoute.Type;
export type AppRoute = typeof AppRoute.Type;

export const homeRouter = pipe(root, mapTo(HomeRoute));
export const sectionRouter = pipe(schemaSegment('section', Section), mapTo(SectionRoute));
export const recordRouter = pipe(
  schemaSegment('section', Section),
  slash(string('id')),
  mapTo(RecordRoute),
);

const routeParser = oneOf(recordRouter, sectionRouter, homeRouter);

export const urlToAppRoute = parseUrlWithFallback(routeParser, NotFoundRoute);

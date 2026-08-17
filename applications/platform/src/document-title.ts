// The one place a route becomes a page title. Two surfaces need it and they
// run in different places: the view titles the tab after the runtime boots,
// and the Worker writes the same string into the served HTML before a crawler
// ever executes the app.
//
// The NAMES are held here rather than read from the clubs and competitions
// tables, for the reason the ticker's club names already are: those tables
// import twenty-five crests and photographs, and a Worker bundle cannot carry
// them. data.test.ts fails when either map drifts from the table it mirrors.

import { screenOf, screenTitles, routeClubSlug, routeCompetitionSlug } from './screen';
import type { AppRoute } from './route';

export const SITE_NAME = 'Skóreová Platform';

export const clubNames: Record<string, string> = {
  'abc-branik': 'ABC Braník',
  'artis-brno': 'Artis Brno',
  'banik-ostrava': 'Baník Ostrava',
  'dynamo-ceske-budejovice': 'Dynamo Č. Budějovice',
  'hradec-kralove': 'Hradec Králové',
  'lokomotiva-brno': 'Lokomotiva Brno',
  pardubice: 'Pardubice',
  'prague-raptors': 'Prague Raptors',
  'sigma-olomouc': 'Sigma Olomouc',
  'slavia-praha': 'Slavia Praha',
  slovacko: 'Slovácko',
  'slovan-liberec': 'Slovan Liberec',
  'slovan-liberec-b': 'Slovan Liberec B',
  'sparta-praha': 'Sparta Praha',
  'sparta-praha-b': 'Sparta Praha B',
  teplice: 'Teplice',
  'viktoria-plzen': 'Viktoria Plzeň',
  'viktoria-plzen-b': 'Viktoria Plzeň B',
  'vysocina-jihlava': 'Vysočina Jihlava',
};

export const competitionNames: Record<string, string> = {
  'domestic-cup': 'Domestic Cup',
  'first-league': 'First League',
  'national-team': 'National Team',
  'second-league': 'Second League',
  uwcl: 'UWCL',
  uwec: 'UWEC',
};

// The open profile's name (club, then competition) titles the tab; away from
// a profile it's the screen's own title, and the front page is just the brand.
// An unrecognized slug falls through to the directory screen's title, matching
// the screen the view draws for it.
export const documentTitle = (route: AppRoute): string => {
  if (route._tag === 'NotFoundRoute') return `Page not found — ${SITE_NAME}`;
  if (screenOf(route) === 'Welcome') return SITE_NAME;
  const name =
    clubNames[routeClubSlug(route)] ??
    competitionNames[routeCompetitionSlug(route)] ??
    screenTitles[screenOf(route)];
  return `${name} — ${SITE_NAME}`;
};

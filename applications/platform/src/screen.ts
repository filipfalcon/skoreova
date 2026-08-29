// The reads that need nothing but the route. They lived in data.ts until the
// Worker had to title a page it was about to serve: the clubs and competitions
// tables import twenty-five crests and photographs, and a Worker bundle cannot
// carry those. data.ts re-exports the whole module, so every existing import of
// these names still resolves through it.

import type { Screen } from './model';
import { AppRoute } from './route';

export const screenTitles: Record<Screen, string> = {
  Welcome: 'Her Game',
  HerGame: 'Her Game',
  Clubs: 'Clubs',
  Players: 'Players',
  Matches: 'Matches',
  Competitions: 'Competitions',
  Officials: 'Officials',
};

// The visible screen implied by the route. The Model stores the route; the
// nav, titles, and screen dispatch read the screen it maps to. The two profile
// routes fold onto their directory screen (the open profile is drawn by
// screenView resolving the slug), and NotFound onto the root (the mock has no
// error page).
export const screenOf = (route: AppRoute): Screen =>
  AppRoute.match<Screen>(route, {
    Welcome: () => 'Welcome',
    HerGame: () => 'HerGame',
    Clubs: () => 'Clubs',
    Club: () => 'Clubs',
    Players: () => 'Players',
    Matches: () => 'Matches',
    Competitions: () => 'Competitions',
    Competition: () => 'Competitions',
    Officials: () => 'Officials',
    NotFound: () => 'Welcome',
  });

// The open club / competition slug, or '' when the route is not that profile.
export const routeClubSlug = (route: AppRoute): string => (route._tag === 'Club' ? route.slug : '');
export const routeCompetitionSlug = (route: AppRoute): string =>
  route._tag === 'Competition' ? route.slug : '';

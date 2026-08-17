// The reads that need nothing but the route. They lived in data.ts until the
// Worker had to title a page it was about to serve: the clubs and competitions
// tables import twenty-five crests and photographs, and a Worker bundle cannot
// carry those. data.ts re-exports the whole module, so every existing import of
// these names still resolves through it.

import { Match as M } from 'effect';

import type { Screen } from './model';
import type { AppRoute } from './route';

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
  M.value(route).pipe(
    M.withReturnType<Screen>(),
    M.tagsExhaustive({
      WelcomeRoute: () => 'Welcome',
      HerGameRoute: () => 'HerGame',
      ClubsRoute: () => 'Clubs',
      ClubRoute: () => 'Clubs',
      PlayersRoute: () => 'Players',
      MatchesRoute: () => 'Matches',
      CompetitionsRoute: () => 'Competitions',
      CompetitionRoute: () => 'Competitions',
      OfficialsRoute: () => 'Officials',
      NotFoundRoute: () => 'Welcome',
    }),
  );

// The open club / competition slug, or '' when the route is not that profile.
export const routeClubSlug = (route: AppRoute): string =>
  route._tag === 'ClubRoute' ? route.slug : '';
export const routeCompetitionSlug = (route: AppRoute): string =>
  route._tag === 'CompetitionRoute' ? route.slug : '';

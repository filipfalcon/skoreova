import { expect, test } from 'vitest';

import {
  clubRouter,
  clubsRouter,
  competitionRouter,
  competitionsRouter,
  herGameRouter,
  matchesRouter,
  officialsRouter,
  playersRouter,
  welcomeRouter,
} from './route';

// The views build every in-app link from these printers rather than hand-coded
// path strings, so a printer that drifts from its route would break navigation
// silently. Pin the exact paths.
test('the route printers emit the paths the views link to', () => {
  expect(welcomeRouter()).toBe('/');
  expect(herGameRouter()).toBe('/her-game');
  expect(clubsRouter()).toBe('/clubs');
  expect(playersRouter()).toBe('/players');
  expect(matchesRouter()).toBe('/matches');
  expect(competitionsRouter()).toBe('/competitions');
  expect(officialsRouter()).toBe('/officials');
  expect(clubRouter({ slug: 'sparta-praha' })).toBe('/clubs/sparta-praha');
  expect(competitionRouter({ slug: 'first-league' })).toBe('/competitions/first-league');
});

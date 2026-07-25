import { Number } from 'effect';
import { expect, test } from 'vitest';

import {
  POINTS_DRAW,
  POINTS_WIN,
  clubs,
  leagueCompetitions,
  leagueTeams,
  standingsFor,
} from './data';
import { MATCHDAYS_PLAYED, leagueRoundCount, leagueRounds } from './schedule';

// THE SEASON CANON'S ARITHMETIC. The league numbers are mock, but a reader
// can add them up — and the version before this one didn't survive that: the
// First League's points column came to 170 when fourteen rounds can only pay
// out 168, and every club's table row claimed fourteen games played while its
// own form bar said twelve. These are the invariants that make the mock
// readable as a real season; they hold for any future edit to the clubs
// table, or they fail here rather than on screen.

const LEAGUES = ['First League', 'Second League'] as const;

// How many matchdays each club has actually appeared in so far — the Second
// League's odd club count means one club sits out each round, so its clubs
// do NOT all arrive at the same number.
const appearancesThroughPlayed = (league: string): Record<string, number> => {
  const counts: Record<string, number> = Object.fromEntries(
    leagueTeams(league).map((team) => [team, 0]),
  );
  for (const round of leagueRounds(league).slice(0, MATCHDAYS_PLAYED)) {
    for (const [home, away] of round) {
      counts[home] = (counts[home] ?? 0) + 1;
      counts[away] = (counts[away] ?? 0) + 1;
    }
  }
  return counts;
};

test.each(LEAGUES)('%s: wins and losses balance, and draws pair off', (league) => {
  const sides = clubs.filter((club) => club.league === league);
  // Every win is somebody's defeat, and a drawn match shows up in two clubs'
  // columns — so an odd total of draws is impossible.
  expect(Number.sumAll(sides.map((club) => club.won))).toBe(
    Number.sumAll(sides.map((club) => club.lost)),
  );
  expect(Number.sumAll(sides.map((club) => club.drawn)) % 2).toBe(0);
});

test.each(LEAGUES)('%s: goals scored equal goals conceded', (league) => {
  const sides = clubs.filter((club) => club.league === league);
  expect(Number.sumAll(sides.map((club) => club.scored))).toBe(
    Number.sumAll(sides.map((club) => club.conceded)),
  );
});

test.each(LEAGUES)('%s: each club has played exactly its fixtures so far', (league) => {
  const appearances = appearancesThroughPlayed(league);
  for (const club of clubs.filter((club) => club.league === league)) {
    expect(club.won + club.drawn + club.lost).toBe(appearances[club.name]);
  }
});

test.each(LEAGUES)('%s: the table derives from the record and ranks downwards', (league) => {
  const rows = standingsFor(league);
  expect(rows).toHaveLength(leagueTeams(league).length);
  for (const row of rows) {
    const club = clubs.find((candidate) => candidate.name === row.team);
    expect(club).toBeDefined();
    if (!club) continue;
    expect(row.played).toBe(club.won + club.drawn + club.lost);
    expect(row.points).toBe(club.won * POINTS_WIN + club.drawn * POINTS_DRAW);
    // A club cannot out-score the maximum its own fixtures can pay.
    expect(row.points).toBeLessThanOrEqual(row.played * POINTS_WIN);
  }
  const points = rows.map((row) => row.points);
  expect(points).toEqual([...points].sort((left, right) => right - left));
});

test.each(LEAGUES)('%s: the league pays out no more points than it has matches', (league) => {
  const rows = standingsFor(league);
  const matches = Number.sumAll(rows.map((row) => row.played)) / 2;
  expect(Number.sumAll(rows.map((row) => row.points))).toBeLessThanOrEqual(matches * POINTS_WIN);
});

// Spelled out because the format copy spells it out. A league whose club
// count has no word here fails the test below rather than shipping a rule
// that opens on the wrong number.
const CLUB_COUNT_WORDS: Record<number, string> = { 8: 'Eight', 11: 'Eleven' };

test.each(LEAGUES)('%s: the stage, progress and format copy match the schedule', (league) => {
  // These four are hand-TYPED — nothing derives them. Every assertion above
  // can pass while they go a round stale, which is exactly what adding a club
  // to the table would do: the arithmetic follows, the sentences don't.
  const competition = leagueCompetitions.find(
    (candidate) =>
      candidate.standings._tag === 'TableStandings' && candidate.standings.league === league,
  );
  expect(competition).toBeDefined();
  if (!competition) return;

  const rounds = leagueRoundCount(league);
  const clubCount = leagueTeams(league).length;
  const stage = `Matchday ${MATCHDAYS_PLAYED} of ${rounds}`;

  expect(competition.stage).toBe(stage);
  expect(competition.progress).toBe(Math.round((MATCHDAYS_PLAYED / rounds) * 100));
  // The open edition's one-liner IS the stage line — the profile shows both.
  expect(competition.editions.find((entry) => entry.isCurrent)?.detail).toBe(stage);
  // Rule 01 states the format: how many clubs, over how many rounds.
  expect(CLUB_COUNT_WORDS[clubCount]).toBeDefined();
  expect(competition.format[0]).toContain(`${CLUB_COUNT_WORDS[clubCount]} clubs`);
  expect(competition.format[0]).toContain(`${rounds} rounds`);
});

test('every club sits in a league the schedule generator knows', () => {
  for (const club of clubs) {
    expect(leagueTeams(club.league)).toContain(club.name);
  }
});

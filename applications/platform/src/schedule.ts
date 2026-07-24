import { Match as M } from 'effect';

import type { Competition } from './data';
import { hashSlug, standingsFor } from './data';

// Fixture generation: a round-robin season generator plus the seeded
// scoreline mock. Shared by the matches screen and both profile screens.

export const MATCHDAYS_PLAYED = 12;

// One full cycle: every team meets every other once.
const singleRoundRobin = (
  teams: ReadonlyArray<string>,
): ReadonlyArray<ReadonlyArray<readonly [string, string]>> => {
  // Odd team counts get a BYE slot; its pairings are dropped per round.
  const pool = teams.length % 2 === 0 ? [...teams] : [...teams, ''];
  const half = pool.length / 2;
  const singles: Array<Array<readonly [string, string]>> = [];
  const rotating = pool.slice(1);
  for (let round = 0; round < pool.length - 1; round += 1) {
    const lineup = [pool[0] ?? '', ...rotating];
    const matches: Array<readonly [string, string]> = [];
    for (let i = 0; i < half; i += 1) {
      const home = lineup[i] ?? '';
      const away = lineup[pool.length - 1 - i] ?? '';
      if (home !== '' && away !== '') {
        // Alternate venues by round so nobody hosts a whole half-season.
        matches.push(round % 2 === 0 ? [home, away] : [away, home]);
      }
    }
    singles.push(matches);
    const moved = rotating.pop();
    if (moved !== undefined) rotating.unshift(moved);
  }
  return singles;
};

const swapVenues = (
  rounds: ReadonlyArray<ReadonlyArray<readonly [string, string]>>,
): ReadonlyArray<ReadonlyArray<readonly [string, string]>> =>
  rounds.map((round) => round.map(([home, away]) => [away, home] as const));

export const roundRobinRounds = (
  teams: ReadonlyArray<string>,
): ReadonlyArray<ReadonlyArray<readonly [string, string]>> => {
  const singles = singleRoundRobin(teams);
  // Second half of the season mirrors the first with venues swapped.
  return [...singles, ...swapVenues(singles)];
};

// A season of a GIVEN length, cycling the round-robin and swapping venues
// each time round — so the eight First League clubs meeting three times
// (21 rounds) and the eleven Second League clubs meeting twice (20) both
// come out of the same generator, matching `leagueRounds`.
export const leagueSchedule = (
  teams: ReadonlyArray<string>,
  totalRounds: number,
): ReadonlyArray<ReadonlyArray<readonly [string, string]>> => {
  const singles = singleRoundRobin(teams);
  if (singles.length === 0) return [];
  const season: Array<ReadonlyArray<readonly [string, string]>> = [];
  for (let cycle = 0; season.length < totalRounds; cycle += 1) {
    const rounds = cycle % 2 === 0 ? singles : swapVenues(singles);
    for (const round of rounds) {
      if (season.length === totalRounds) break;
      season.push(round);
    }
  }
  return season;
};

// Hand-set results, keyed by the same seed the generator uses. The seeded
// mock is fine as filler, but a specific scoreline someone asked for has
// to survive any change to the hash — hence an explicit override rather
// than fishing for a seed that happens to produce it.
const SCORE_OVERRIDES: Record<string, readonly [number, number]> = {
  // Sparta win the derby at Slavia.
  'First League-14-Slavia Praha-Sparta Praha': [0, 1],
};

export const mockScore = (seed: string): readonly [number, number] => {
  const override = SCORE_OVERRIDES[seed];
  if (override !== undefined) return override;
  const hash = hashSlug(seed);
  return [hash % 5, (hash >> 3) % 4];
};

// How many rounds a competition's picker can address: a league season's
// full double round-robin, or a single "round" for knockout competitions
// (which render no picker). SelectedCompetitionRound clamps against this in
// `update`, so the Model never holds an out-of-range round.
export const competitionRoundCount = (competition: Competition): number =>
  M.value(competition.standings).pipe(
    M.withReturnType<number>(),
    M.tagsExhaustive({
      TableStandings: ({ league }) =>
        roundRobinRounds(standingsFor(league).map((row) => row.team)).length,
      TiesStandings: () => 1,
    }),
  );

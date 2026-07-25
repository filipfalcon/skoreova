import { Array, Match as M } from 'effect';

import type { Competition } from './data';
import { hashSlug, standingsFor } from './data';

// Fixture generation: a round-robin season generator plus the seeded
// scoreline mock. Shared by the matches screen and both profile screens.

export const MATCHDAYS_PLAYED = 12;

// One matchday's pairings, and a season as a list of them.
type Fixture = readonly [string, string];
type Round = ReadonlyArray<Fixture>;

// The circle method's rotation: team 0 stays put and the rest shift by one
// seat per round. Expressed as an index rotation rather than the old
// pop/unshift on a mutable copy.
const rotateRight = (seats: ReadonlyArray<string>, by: number): ReadonlyArray<string> => {
  const pivot = seats.length - (by % Math.max(1, seats.length));
  return [...seats.slice(pivot), ...seats.slice(0, pivot)];
};

// One full cycle: every team meets every other once.
const singleRoundRobin = (teams: ReadonlyArray<string>): ReadonlyArray<Round> => {
  // Odd team counts get a BYE slot; its pairings are dropped per round.
  const pool = teams.length % 2 === 0 ? teams : [...teams, ''];
  if (pool.length < 2) return [];
  const half = pool.length / 2;
  const fixed = pool[0] ?? '';
  const rotating = pool.slice(1);
  return Array.makeBy(pool.length - 1, (round) => {
    const lineup = [fixed, ...rotateRight(rotating, round)];
    return Array.range(0, half - 1).flatMap((seat): ReadonlyArray<Fixture> => {
      const home = lineup[seat] ?? '';
      const away = lineup[pool.length - 1 - seat] ?? '';
      // The BYE seat's pairing is the one that drops out.
      if (home === '' || away === '') return [];
      // Alternate venues by round so nobody hosts a whole half-season.
      return [round % 2 === 0 ? [home, away] : [away, home]];
    });
  });
};

const swapVenuesInRound = (round: Round): Round =>
  round.map(([home, away]) => [away, home] as const);

const swapVenues = (rounds: ReadonlyArray<Round>): ReadonlyArray<Round> =>
  rounds.map(swapVenuesInRound);

export const roundRobinRounds = (teams: ReadonlyArray<string>): ReadonlyArray<Round> => {
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
): ReadonlyArray<Round> => {
  const singles = singleRoundRobin(teams);
  if (Array.isReadonlyArrayEmpty(singles)) return [];
  // Round n comes from cycle ⌊n / cycleLength⌋ of the same pairings, with
  // venues swapped on every other cycle — indexing straight into that
  // instead of pushing rounds until the season is long enough.
  return Array.makeBy(totalRounds, (index) => {
    const round = singles[index % singles.length] ?? [];
    const isReturnCycle = Math.floor(index / singles.length) % 2 === 1;
    return isReturnCycle ? swapVenuesInRound(round) : round;
  });
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

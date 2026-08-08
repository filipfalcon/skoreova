import { Array, Match as M } from 'effect';
import { Calendar } from 'foldkit';

import type { Competition } from './data';
import { hashSlug, leagueTeams } from './data';

// Fixture generation: a round-robin season generator plus the seeded
// scoreline mock. Shared by the matches screen and both profile screens.

export const MATCHDAYS_PLAYED = 12;

// The season opens Sat 16 Aug 2025; league rounds land a week apart. Canon
// here, not in a view module: the club calendar's dates and the competition
// hero's season timeline both read the same clock, so a fixture can't sit
// on two different days on two screens.
export const SEASON_OPENING = Calendar.make(2025, 8, 16);
export const DAYS_PER_ROUND = 7;

// One matchday’s pairings, and a season as a list of them.
type Fixture = readonly [string, string];
type Round = ReadonlyArray<Fixture>;

// The circle method’s rotation: team 0 stays put and the rest shift by one
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
      // The BYE seat’s pairing is the one that drops out.
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

// A LEAGUE’S SEASON — the one schedule every screen reads. The competition
// profile’s matches panel, the club profile’s calendar, and the round
// picker’s end-stop all come from here, so a fixture is in the same round
// with the same venue wherever it appears. Its length is the club count’s to
// decide: eight clubs meet home and away over 14 rounds, eleven over 22 with
// one club idle each matchday. (A hand-set season length used to live beside
// this in `leagueRounds`, and disagreed with it — 21 and 20.)
export const leagueRounds = (league: string): ReadonlyArray<Round> =>
  roundRobinRounds(leagueTeams(league));

export const leagueRoundCount = (league: string): number => leagueRounds(league).length;

// A season’s SHAPE, phase by phase — what the competition hero’s timeline
// draws. Authored rather than derived: where a season splits is a
// competition RULE, not arithmetic on the round count (the timeline used to
// halve the double round-robin, which put the First League’s seam at 7).
// The First League runs everyone home and away, then the table halves and
// each group plays its own double round-robin — 14 then 6.
//
// Only the regular phase has fixtures behind it today: `leagueRounds` stops
// at the double round-robin, so a split round has no pairings to page to.
// The current matchday sits inside the regular phase, so the split bar
// renders empty either way.
interface SeasonPhase {
  readonly label: string;
  readonly rounds: number;
}

const LEAGUE_PHASES: { readonly [league: string]: ReadonlyArray<SeasonPhase> } = {
  'First League': [
    { label: 'Regular phase', rounds: 14 },
    { label: 'Split phase', rounds: 6 },
  ],
};

// A league with no authored format runs as one straight phase the length of
// its own round-robin — the Second League’s 22 rounds, and any league added
// before its format is written down.
export const leaguePhases = (league: string): ReadonlyArray<SeasonPhase> =>
  LEAGUE_PHASES[league] ?? [{ label: 'Regular phase', rounds: leagueRoundCount(league) }];

// ONE seed per fixture, so the competition screen and the club calendar
// can’t disagree about a scoreline. They used to build their own seeds from
// different parts ('<slug>:<round>:<index>' against
// '<league>-<round>-<home>-<away>'), and the same match rendered 0–3 on one
// screen and 4–0 on the other.
export const fixtureSeed = (league: string, round: number, home: string, away: string): string =>
  `${league}:${round}:${home}:${away}`;

// Hand-set results, keyed by that same seed. The seeded mock is fine as
// filler, but a specific scoreline someone asked for has to survive any
// change to the hash — hence an explicit override rather than fishing for a
// seed that happens to produce it.
export const SCORE_OVERRIDES: Record<string, readonly [number, number]> = {
  // Sparta take the derby at Letná. Round 7 is the FIRST meeting and the one
  // that has been played; the return at Slavia’s ground is round 14, past the
  // current matchday, so an override keyed there renders nowhere — which is
  // where this one used to sit while the derby people can actually see showed
  // a hash score. data.test.ts now refuses a key past MATCHDAYS_PLAYED.
  [fixtureSeed('First League', 7, 'Sparta Praha', 'Slavia Praha')]: [1, 0],
};

export const mockScore = (seed: string): readonly [number, number] => {
  const override = SCORE_OVERRIDES[seed];
  if (override !== undefined) return override;
  const hash = hashSlug(seed);
  return [hash % 5, (hash >> 3) % 4];
};

// How many rounds a competition’s picker can address: a league season’s
// full double round-robin, or a single "round" for knockout competitions
// (which render no picker). SelectedCompetitionRound clamps against this in
// `update`, so the Model never holds an out-of-range round.
export const competitionRoundCount = (competition: Competition): number =>
  M.value(competition.standings).pipe(
    M.withReturnType<number>(),
    M.tagsExhaustive({
      TableStandings: ({ league }) => leagueRoundCount(league),
      TiesStandings: () => 1,
    }),
  );

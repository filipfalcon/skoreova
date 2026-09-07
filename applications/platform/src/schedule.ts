import { Array, Match, Option } from 'effect';
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

// The DAY a round is played on, `dayOffset` days into that round's weekend
// (0 = the Saturday the round opens). The one place the season's clock is
// turned into a date: the club calendar, the home page's weekly carousel and
// the cup's authored ties all come through here, so a fixture cannot sit on
// two different days on two screens.
export const roundDay = (round: number, dayOffset = 0): Date =>
  Calendar.toDateLocal(Calendar.addDays(SEASON_OPENING, (round - 1) * DAYS_PER_ROUND + dayOffset));

// A modulo of a non-empty tuple always lands in range, so the fallback is
// unreachable — and it is the first kickoff rather than an off-canon time,
// so a future edit to KICKOFFS can’t leak one either.
const KICKOFFS = ['14:00', '16:00', '17:30', '19:00'] as const;

// A fixture's kickoff, off its own seed. Canon here rather than in a view
// (it began in the club calendar) because two screens now print it, and a
// second copy of this table is a second answer to what time a match starts.
export const kickoffFor = (seed: string): string =>
  KICKOFFS[hashSlug(seed) % KICKOFFS.length] ?? KICKOFFS[0];

// Minutes past midnight, for ORDERING a matchday. The carousel runs
// ascending by kickoff, and '17:30' sorts before '9:00' as a string.
export const kickoffMinutes = (kickoff: string): number => {
  const [hours = '0', minutes = '0'] = kickoff.split(':');
  return globalThis.Number(hours) * 60 + globalThis.Number(minutes);
};

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

// A season’s SHAPE — its phases and how far into them we are, which is what
// the competition hero’s timeline draws. Authored rather than derived:
// where a season splits is a competition RULE, not arithmetic on the round
// count (the timeline used to halve the double round-robin, which put the
// First League’s seam at 7). Keyed by SLUG, not by league: a knockout has a
// shape too, and no league to key on.
//
// `played` is rounds COMPLETE. A league reads the season’s matchday clock;
// a cup has no matchday, so its progress is authored beside its phases.
//
// Fixtures lag the shapes: `leagueRounds` stops at the double round-robin
// and the cup generates none at all, so the matches panel can’t page to
// every round a bar draws.
export interface SeasonPhase {
  readonly label: string;
  readonly rounds: number;
}

export interface SeasonShape {
  // Which league's table this shape governs, where there is one. A cup has
  // no league, so the standings lookup simply never matches it.
  readonly league?: string;
  readonly played: number;
  readonly phases: ReadonlyArray<SeasonPhase>;
  // Where the table SPLITS — the last position in the title group. The
  // standings draw a line under it. Configuration, not a hardcoded row
  // index in the view: a league that splits 6/6 or not at all has to be
  // able to say so here.
  readonly splitAfter?: number;
  // How many clubs ENTER. Authored, and only where it has to be: a league's
  // count is derived from the clubs table, but a cup draws in sides from
  // outside it — the table here holds nineteen clubs and the cup takes 48.
  readonly entrants?: number;
}

const COMPETITION_SHAPES: { readonly [slug: string]: SeasonShape } = {
  // Both leagues run everyone home and away, then the table halves and each
  // group plays its own double round-robin.
  'first-league': {
    league: 'First League',
    played: MATCHDAYS_PLAYED,
    splitAfter: 4,
    phases: [
      { label: 'Regular phase', rounds: 14 },
      { label: 'Split phase', rounds: 6 },
    ],
  },
  'second-league': {
    league: 'Second League',
    played: MATCHDAYS_PLAYED,
    phases: [
      { label: 'Regular phase', rounds: 18 },
      { label: 'Split phase', rounds: 6 },
    ],
  },
  // The cup is at the SEMIS (its `stage` in data.ts): the five qualifying
  // rounds and the quarterfinal are behind it, and the semi is the round
  // being played — six complete of eight.
  'domestic-cup': {
    played: 6,
    entrants: 48,
    phases: [
      { label: 'Qualifiers', rounds: 5 },
      { label: 'Knockout', rounds: 3 },
    ],
  },
};

// A competition with no authored format falls back to its own round-robin
// as one straight phase — what any LEAGUE added here draws until its real
// format is written down. A knockout has nothing to fall back to, so it
// gets no shape and the hero keeps its stage chip instead of a timeline.
export const competitionShape = (competition: Competition): Option.Option<SeasonShape> =>
  Option.fromUndefinedOr(COMPETITION_SHAPES[competition.slug]).pipe(
    Option.orElse(() =>
      Match.value(competition.standings).pipe(
        Match.withReturnType<Option.Option<SeasonShape>>(),
        Match.tagsExhaustive({
          TableStandings: ({ league }) =>
            Option.some({
              played: MATCHDAYS_PLAYED,
              phases: [{ label: 'Regular phase', rounds: leagueRoundCount(league) }],
            }),
          TiesStandings: () => Option.none(),
        }),
      ),
    ),
  );

// The shape belonging to a LEAGUE rather than a competition — the standings
// table knows which league it is drawing, not which competition wraps it.
// Matches on the league the shape's competition points at, so the split
// boundary a table draws is the one its own season declares.
export const competitionShapeForLeague = (league: string): Option.Option<SeasonShape> =>
  Option.fromUndefinedOr(
    Object.entries(COMPETITION_SHAPES).find(([, shape]) => shape.league === league)?.[1],
  );

// A club's RECENT FORM, read off the same fixtures and the same scores the
// matches panel shows — so a row's five squares can never disagree with the
// results a reader can scroll to. Oldest first, newest last.
//
// Derived rather than authored for that reason, and it is worth knowing
// what it is NOT: the club records in data.ts carry authored won/drawn/lost
// totals, and nothing reconciles those with the seeded scorelines. The
// squares describe the fixtures; the totals describe the table.
// Four states. 'U' is a fixture the club has not played yet, which is why
// the window reaches past the current matchday at all.
export type FormResult = 'W' | 'D' | 'L' | 'U';

// A club's form WINDOW: its last `played` results followed by its next
// `upcoming` fixtures, oldest to newest, so the strip reads left to right
// with what is still to come on the right.
//
// Every value comes from the season's own fixtures and the seeded
// scoreline — the same two functions the matches panel reads — so a row's
// squares can never disagree with results the reader can scroll to.
export const formWindow = (
  league: string,
  team: string,
  played: number,
  upcoming: number,
): ReadonlyArray<FormResult> => {
  const rounds = leagueRounds(league);
  const own = (round: ReadonlyArray<readonly [string, string]>) =>
    round.find(([home, away]) => home === team || away === team);
  const behind: Array<FormResult> = [];
  rounds.slice(0, MATCHDAYS_PLAYED).forEach((round, index) => {
    const fixture = own(round);
    if (fixture === undefined) return;
    const [home, away] = fixture;
    const [homeGoals, awayGoals] = mockScore(fixtureSeed(league, index + 1, home, away));
    const [mine, theirs] = home === team ? [homeGoals, awayGoals] : [awayGoals, homeGoals];
    behind.push(mine > theirs ? 'W' : mine < theirs ? 'L' : 'D');
  });
  const ahead: Array<FormResult> = [];
  rounds.slice(MATCHDAYS_PLAYED).forEach((round) => {
    if (ahead.length >= upcoming) return;
    if (own(round) !== undefined) ahead.push('U');
  });
  return [...behind.slice(-played), ...ahead];
};

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

// CALLED OFF. Keyed by the same fixture seed as the score overrides, because
// a postponement is the other thing that can be true about a specific match
// and nothing about it is derivable — no hash decides that a tie was called
// off. A postponed fixture keeps its place in the round (that is what it was
// scheduled for, and it is how the carousel still orders it), but it prints
// no kickoff: the time it was going to have is the time nobody should turn
// up at.
export const POSTPONED: ReadonlySet<string> = new Set([
  // Round 13's Saturday late game, off for a frozen pitch in Liberec.
  fixtureSeed('First League', MATCHDAYS_PLAYED + 1, 'Slovan Liberec', 'Lokomotiva Brno'),
]);

export const isPostponed = (seed: string): boolean => POSTPONED.has(seed);

export const mockScore = (seed: string): readonly [number, number] => {
  const override = SCORE_OVERRIDES[seed];
  if (override !== undefined) return override;
  const hash = hashSlug(seed);
  return [hash % 5, (hash >> 3) % 4];
};

// THE CUP'S LIVE TIES. The generator above only knows how to build a
// round-robin, so the knockout has none — these are authored, and they are
// the only fixtures in the app that are.
//
// They still ride the LEAGUE'S clock rather than carrying dates of their
// own: a tie names the matchday weekend it shares and which day of it, and
// `roundDay` turns that into a date exactly as it does for a league round.
// The cup's own numbering (round 7 of 8 — see COMPETITION_SHAPES) says where
// the competition stands; `weekend` says when it is played. Those are
// different questions, and an authored date would have answered the second
// one twice.
//
// data.test.ts holds the competition's ties list to these — the profile
// prints the same two semifinals as prose, and the two must not drift.
export interface CupTieFixture {
  readonly stage: string;
  readonly home: string;
  readonly away: string;
  readonly weekend: number;
  readonly dayOffset: number;
}

export const CUP_SLUG = 'domestic-cup';

// MIDWEEK, which is what the negative offsets say: four days before the next
// round's Saturday is the Tuesday of that week, three the Wednesday. That is
// where a cup semifinal actually sits, and it also keeps the four semi-
// finalists off two matches in two days.
//
// The PAIRINGS avoid every fixture in the rounds either side of them. They
// were Sparta v Slovácko and Slavia v Baník, and both are literally round 13
// of the First League — the weekend board printed the same two clubs twice,
// once as a cup tie and once as a league game. The four semifinalists are
// unchanged (clubCupRun names the same four), only who meets whom.
export const CUP_TIES: ReadonlyArray<CupTieFixture> = [
  {
    stage: 'Semifinal',
    home: 'Sparta Praha',
    away: 'Slavia Praha',
    weekend: MATCHDAYS_PLAYED + 1,
    dayOffset: -4,
  },
  {
    stage: 'Semifinal',
    home: 'Slovácko',
    away: 'Baník Ostrava',
    weekend: MATCHDAYS_PLAYED + 1,
    dayOffset: -3,
  },
];

// How many rounds a competition’s picker can address: a league season’s
// full double round-robin, or a single "round" for knockout competitions
// (which render no picker). SelectedCompetitionRound clamps against this in
// `update`, so the Model never holds an out-of-range round.
export const competitionRoundCount = (competition: Competition): number =>
  Match.value(competition.standings).pipe(
    Match.withReturnType<number>(),
    Match.tagsExhaustive({
      TableStandings: ({ league }) => leagueRoundCount(league),
      TiesStandings: () => 1,
    }),
  );

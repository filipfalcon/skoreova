import { Array, Match as EffectMatch, Option, Order, pipe } from 'effect';

import { clubStanding, clubVenue, competitionBySlug, leagueCompetitions } from './data';
import type { Competition, Match } from './data';
import { FinishedMatch, PostponedMatch, UpcomingMatch } from './data';
import { SEASON_RESUMES, editorialFor } from './editorial';
import {
  CUP_SLUG,
  CUP_TIES,
  DAYS_PER_ROUND,
  MATCHDAYS_PLAYED,
  fixtureSeed,
  isPostponed,
  kickoffFor,
  kickoffMinutes,
  leagueRounds,
  mockScore,
  roundDay,
} from './schedule';

// THE PULSE — what the platform is showing this week, assembled from the
// season canon: the nearest round's fixtures, then the last round's results,
// across every competition at once.
//
// It lives here rather than in the home page's view because the home page is
// not the only thing that will ask. It is also what makes the section's
// EMPTY state reachable: the matchday clock is a parameter, so a test can
// wind it to the end of the season and see what the page does when there is
// nothing left to play (see pulse.test.ts) — the real page always passes
// MATCHDAYS_PLAYED.

// A match plus WHEN it kicks off, in minutes from the season's opening
// whistle. The sort key the carousel orders by and the card has no use for,
// so it is stripped before the matches leave this module.
interface Scheduled {
  readonly at: number;
  readonly match: Match;
}

const MINUTES_PER_DAY = 24 * 60;

const weekdayOf = (day: Date): string =>
  day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

// The fixture list stores a kickoff as '14:00'; the app prints one as
// '2:00 PM'. American English throughout the UI, brand and place names
// aside — so the 24-hour clock the schedule counts in never reaches a
// screen.
const clockOf = (kickoff: string): string => {
  const [hours = '0', minutes = '00'] = kickoff.split(':');
  const hour = globalThis.Number(hours);
  const half = hour < 12 ? 'AM' : 'PM';
  return `${hour % 12 === 0 ? 12 : hour % 12}:${minutes} ${half}`;
};

export const kickoffLabel = (day: Date, kickoff: string): string =>
  `${weekdayOf(day)} · ${clockOf(kickoff)}`;

// The DATE the pause card prints, or '' when the desk has not set one. An
// unannounced return is an ordinary state, not a hole to fill: the card drops
// the whole "returns on" block rather than printing a guess or a dash.
export const resumesLabel = (): string =>
  SEASON_RESUMES === undefined
    ? ''
    : SEASON_RESUMES.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });

// A venue for the home side. Every club in our table has one; a side from
// outside it (the cup draws in 48 entrants, the table holds 19) has none, and
// the card simply prints no venue line rather than an invented ground.
const venueOf = (home: string): string => clubVenue(home) ?? '';

// ONE league fixture, in whichever of the three states it is in. A round past
// the matchday clock is upcoming — unless it was called off, which is the one
// thing about a fixture that no amount of arithmetic can tell you.
const leagueMatch = (
  competition: Competition,
  league: string,
  round: number,
  home: string,
  away: string,
  isPlayed: boolean,
): Scheduled => {
  const seed = fixtureSeed(league, round, home, away);
  const kickoff = kickoffFor(seed);
  const [homeGoals, awayGoals] = mockScore(seed);
  const desk = editorialFor(seed);
  return {
    // A postponed tie keeps the slot it was scheduled for. That is what it
    // was, it is how the round still reads in order, and none of it is
    // printed — only the ordering uses this number.
    at: (round - 1) * DAYS_PER_ROUND * MINUTES_PER_DAY + kickoffMinutes(kickoff),
    match: {
      competition: competition.name,
      competitionSlug: competition.slug,
      stage: `Round ${round}`,
      home,
      away,
      featured: desk.featured ?? false,
      heroImage: desk.heroImage ?? '',
      storyLine: desk.storyLine ?? '',
      state: isPostponed(seed)
        ? PostponedMatch.make({})
        : isPlayed
          ? FinishedMatch.make({ homeGoals, awayGoals })
          : UpcomingMatch.make({
              kickoff: kickoffLabel(roundDay(round), kickoff),
              venue: venueOf(home),
            }),
    },
  };
};

// Every league fixture in one round. `isPlayed` is the caller's call rather
// than a comparison against the clock in here: the two lists this module
// builds are exactly "the round before the clock" and "the round after it",
// and deriving it twice would be two chances to disagree.
const leagueRound = (round: number, isPlayed: boolean): ReadonlyArray<Scheduled> =>
  leagueCompetitions.flatMap((competition) =>
    EffectMatch.value(competition.standings).pipe(
      EffectMatch.withReturnType<ReadonlyArray<Scheduled>>(),
      EffectMatch.tagsExhaustive({
        TiesStandings: () => [],
        TableStandings: ({ league }) =>
          (leagueRounds(league)[round - 1] ?? []).map(([home, away]) =>
            leagueMatch(competition, league, round, home, away, isPlayed),
          ),
      }),
    ),
  );

// The cup's authored ties, for the weekend the caller is looking at. They are
// all still to be played — the cup stands at its semifinals — so there is no
// finished branch here to write.
const cupRound = (weekend: number): ReadonlyArray<Scheduled> => {
  const cup = Option.getOrUndefined(competitionBySlug(CUP_SLUG));
  if (cup === undefined) return [];
  return CUP_TIES.filter((tie) => tie.weekend === weekend).map((tie) => {
    const seed = fixtureSeed(cup.name, tie.weekend, tie.home, tie.away);
    const kickoff = kickoffFor(seed);
    const day = roundDay(tie.weekend, tie.dayOffset);
    const desk = editorialFor(seed);
    return {
      at:
        ((tie.weekend - 1) * DAYS_PER_ROUND + tie.dayOffset) * MINUTES_PER_DAY +
        kickoffMinutes(kickoff),
      match: {
        competition: cup.name,
        competitionSlug: cup.slug,
        stage: tie.stage,
        home: tie.home,
        away: tie.away,
        featured: desk.featured ?? false,
        heroImage: desk.heroImage ?? '',
        storyLine: desk.storyLine ?? '',
        state: isPostponed(seed)
          ? PostponedMatch.make({})
          : UpcomingMatch.make({
              kickoff: kickoffLabel(day, kickoff),
              venue: venueOf(tie.home),
            }),
      },
    };
  });
};

const byKickoff = Order.mapInput(Order.Number, (entry: Scheduled) => entry.at);

const inOrder = (entries: ReadonlyArray<Scheduled>): ReadonlyArray<Match> =>
  pipe(
    entries,
    Array.sort(byKickoff),
    Array.map((entry) => entry.match),
  );

// ——— THE HERO SLOT ———
//
// Exactly one card leads the carousel, and it is chosen in this order:
//
//   1. the match the desk marked `featured` — the Monday pick;
//   2. failing that, a cup tie over a league tie;
//   3. failing that, the highest-placed pairing.
//
// …and then the whole order is filtered by ONE hard requirement: the hero
// must have a photograph. The hero layout IS the photograph, so a candidate
// without one is not a hero — it degrades to a compact card and the slot
// passes down the list. If no match this week has a photograph, there is no
// hero and the carousel is compact end to end. Nothing here reaches for a
// stand-in image; that is the whole point of the rule.
//
// "Highest-placed" means furthest UP the table, so the SMALLEST sum of the
// two positions: 1st v 2nd (3) leads 5th v 6th (11). A tie with a side that
// has no row in our tables — the cup draws in clubs from outside them — sorts
// last rather than being scored on a position it does not have.
const NO_POSITION = globalThis.Number.MAX_SAFE_INTEGER;

const positionSum = (match: Match): number => {
  const home = clubStanding(match.home);
  const away = clubStanding(match.away);
  // Only comparable within one table. Sides from different leagues, or a side
  // with no row at all, sort last rather than being scored on a sum that does
  // not mean anything.
  return home === undefined || away === undefined || home.league !== away.league
    ? NO_POSITION
    : home.position + away.position;
};

const ascendingBy = (key: (match: Match) => number) => Order.mapInput(Order.Number, key);

const heroCandidates = (upcoming: ReadonlyArray<Match>): ReadonlyArray<Match> =>
  pipe(
    upcoming,
    Array.sortBy(
      ascendingBy((match) => (match.featured ? 0 : 1)),
      ascendingBy((match) => (match.competitionSlug === CUP_SLUG ? 0 : 1)),
      ascendingBy(positionSum),
    ),
  );

export interface Pulse {
  // The week's lead card, or undefined when nothing qualifies. Never also in
  // `upcoming` — it is lifted out, so the carousel is hero + upcoming +
  // finished with no fixture printed twice.
  readonly hero: Match | undefined;
  // The rest of the nearest round, ascending by kickoff — the invitations.
  readonly upcoming: ReadonlyArray<Match>;
  // The round just gone, same ordering — the chronicle.
  readonly finished: ReadonlyArray<Match>;
}

// `played` is the matchday clock: how many rounds are complete. The nearest
// round is the one after it, the last results are the one at it.
export const pulse = (played: number): Pulse => {
  const upcoming = inOrder([...leagueRound(played + 1, false), ...cupRound(played + 1)]);
  const hero = heroCandidates(upcoming).find((match) => match.heroImage !== '');
  return {
    hero,
    // Compared by identity, not by name: the same two clubs can legitimately
    // appear twice in one week (a league game and a cup tie), and dropping
    // "the match with these teams" would take the wrong one out.
    upcoming: upcoming.filter((match) => match !== hero),
    finished: inOrder(leagueRound(played, true)),
  };
};

export const thisWeek = (): Pulse => pulse(MATCHDAYS_PLAYED);

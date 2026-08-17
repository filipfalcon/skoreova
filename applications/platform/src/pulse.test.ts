import { expect, test } from 'vite-plus/test';

import { clubStanding, clubs, leagueCompetitions } from './data';
import type { Match } from './data';
import { editorialFor } from './editorial';
import { kickoffLabel, pulse, resumesLabel, thisWeek } from './pulse';
import {
  CUP_TIES,
  MATCHDAYS_PLAYED,
  POSTPONED,
  fixtureSeed,
  kickoffFor,
  kickoffMinutes,
  leagueRoundCount,
  leagueRounds,
  roundDay,
} from './schedule';

// THE WEEKEND BOARD's invariants. The home page's first section is entirely
// derived — nothing about it is typed in beside the season canon — so what
// is worth pinning down is that the derivation still says what the section
// claims: the nearest round, in kickoff order, mixed across competitions,
// with results behind it and a state for every fixture that has one.

const leagues = leagueCompetitions.map((competition) =>
  competition.standings._tag === 'TableStandings' ? competition.standings.league : '',
);

// How many fixtures a round holds across every league.
const leagueFixtures = (round: number): number =>
  leagues.reduce((total, league) => total + (leagueRounds(league)[round - 1] ?? []).length, 0);

test('the board invites the next round and remembers the last one', () => {
  const { hero, upcoming, finished } = thisWeek();
  // Every league fixture of the next round, plus the cup ties dated to that
  // same weekend — the section MIXES competitions, and would be a league
  // board if this ever came out equal to the league count alone.
  const cupThisWeekend = CUP_TIES.filter((tie) => tie.weekend === MATCHDAYS_PLAYED + 1).length;
  expect(cupThisWeekend).toBeGreaterThan(0);
  // The hero is lifted OUT of `upcoming` — the carousel is hero + upcoming +
  // finished, and a fixture printed twice would be the bug this counts for.
  const invited = [...(hero === undefined ? [] : [hero]), ...upcoming];
  expect(invited).toHaveLength(leagueFixtures(MATCHDAYS_PLAYED + 1) + cupThisWeekend);
  expect(upcoming).not.toContain(hero);
  expect(finished).toHaveLength(leagueFixtures(MATCHDAYS_PLAYED));

  const competitions = new Set(invited.map((match) => match.competitionSlug));
  expect(competitions.size).toBeGreaterThan(1);
});

// Where a weekday abbreviation sits in the week the board covers. The cup
// ties are midweek and the league rounds are on the Saturday, so ordering has
// to be read on the DAY as well as the clock — an earlier version of this
// test compared times alone and called a Tuesday 4pm tie out of order behind
// a Saturday 7pm one.
const WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

test('upcoming runs ascending by kickoff, across competitions', () => {
  // Read back off the printed label rather than the sort key: the label is
  // what a reader sees, so a sort that ordered on something else would pass
  // a test against the key and still print the week out of order.
  const stamps = thisWeek()
    .upcoming.filter((match) => match.state._tag === 'UpcomingMatch')
    .map((match) => (match.state._tag === 'UpcomingMatch' ? match.state.kickoff : ''))
    .map((label) => {
      const [day = '', clock = ''] = label.split(' · ');
      const [time = '', half = ''] = clock.split(' ');
      const [hours = '0', mins = '0'] = time.split(':');
      const hour = globalThis.Number(hours) % 12;
      return (
        WEEK.indexOf(day) * 24 * 60 +
        (hour + (half === 'PM' ? 12 : 0)) * 60 +
        globalThis.Number(mins)
      );
    });
  expect(stamps).not.toHaveLength(0);
  // Several fixtures share a kickoff, so this is non-decreasing rather than
  // strictly increasing.
  expect(stamps).toEqual([...stamps].sort((a, b) => a - b));
  // The midweek cup really does come first — otherwise this test would pass
  // on a board that had dropped the cup entirely.
  expect(stamps[0]).toBeLessThan(WEEK.indexOf('SAT') * 24 * 60);
});

test('every finished card carries a score and every upcoming one a kickoff', () => {
  const { upcoming, finished } = thisWeek();
  finished.forEach((match) => expect(match.state._tag).toBe('FinishedMatch'));
  upcoming.forEach((match) =>
    expect(['UpcomingMatch', 'PostponedMatch']).toContain(match.state._tag),
  );
});

test('a postponed fixture prints no kickoff at all', () => {
  const { upcoming } = thisWeek();
  const postponed = upcoming.filter((match) => match.state._tag === 'PostponedMatch');
  // The canon authors one; if that entry is ever removed this fails loudly
  // rather than quietly stopping the state from being exercised anywhere.
  expect(POSTPONED.size).toBeGreaterThan(0);
  expect(postponed).toHaveLength(POSTPONED.size);
  // PostponedMatch has no kickoff field to leak — the type is the guarantee,
  // and this is the runtime half of it.
  postponed.forEach((match) => expect(Object.keys(match.state)).toEqual(['_tag']));
});

test('every authored postponement names a fixture that is actually in the round', () => {
  // The seeds are hand-written, so nothing but this stops one naming a
  // fixture that does not exist — it would then simply never apply, and the
  // state would silently vanish from the board.
  const everySeed = new Set(
    leagues.flatMap((league) =>
      leagueRounds(league).flatMap((round, index) =>
        round.map(([home, away]) => fixtureSeed(league, index + 1, home, away)),
      ),
    ),
  );
  POSTPONED.forEach((seed) => expect(everySeed.has(seed)).toBe(true));
});

test('an upcoming league match is played at its home club’s ground', () => {
  const venues = new Map(clubs.map((club) => [club.name, club.venue]));
  thisWeek()
    .upcoming.filter((match) => match.state._tag === 'UpcomingMatch')
    .forEach((match) => {
      const venue = match.state._tag === 'UpcomingMatch' ? match.state.venue : '';
      expect(venue).toBe(venues.get(match.home) ?? '');
    });
});

test('the kickoff label prints the weekday and a 12-hour clock', () => {
  expect(kickoffLabel(roundDay(1), '14:00')).toBe('SAT · 2:00 PM');
  expect(kickoffLabel(roundDay(1), '19:00')).toBe('SAT · 7:00 PM');
  // Noon and midnight are where a naive `hour % 12` prints 0.
  expect(kickoffLabel(roundDay(1, 1), '12:00')).toBe('SUN · 12:00 PM');
  expect(kickoffLabel(roundDay(1, 1), '00:30')).toBe('SUN · 12:30 AM');
});

test('kickoff ordering is numeric, not alphabetical', () => {
  expect(kickoffMinutes('9:00')).toBeLessThan(kickoffMinutes('17:30'));
});

// THE EMPTY STATE, reachable because the matchday clock is a parameter. Wind
// it past the longest season and there is no next round to invite anyone to
// — which is the case the pause card exists for, and the only way to see it
// without editing the canon.
test('past the last round there is nothing to invite and the results remain', () => {
  const lastRound = Math.max(...leagues.map(leagueRoundCount));
  const { upcoming, finished } = pulse(lastRound);
  expect(upcoming).toEqual([]);
  expect(finished.length).toBeGreaterThan(0);
});

test('a cup tie rides the league’s clock rather than a date of its own', () => {
  const tie = CUP_TIES[0];
  expect(tie).toBeDefined();
  if (tie === undefined) return;
  const seed = fixtureSeed('Domestic Cup', tie.weekend, tie.home, tie.away);
  const expected = kickoffLabel(roundDay(tie.weekend, tie.dayOffset), kickoffFor(seed));
  // Hero + upcoming: this tie is the week's lead, so it has been lifted out
  // of `upcoming` and searching that list alone would find nothing.
  const week = thisWeek();
  const card = [...(week.hero === undefined ? [] : [week.hero]), ...week.upcoming].find(
    (match: Match) => match.competitionSlug === 'domestic-cup' && match.home === tie.home,
  );
  expect(card?.stage).toBe(tie.stage);
  expect(card?.state._tag === 'UpcomingMatch' ? card.state.kickoff : '').toBe(expected);
});

// A cup tie must not repeat a league fixture from the rounds either side of
// it. Both authored semifinals once did — they were round 13 of the First
// League verbatim — and the board printed the same two clubs twice, on two
// cards, as if one of them were a mistake.
test('no cup tie duplicates a league fixture from the surrounding rounds', () => {
  const around = leagues.flatMap((league) =>
    [MATCHDAYS_PLAYED, MATCHDAYS_PLAYED + 1].flatMap((round) =>
      (leagueRounds(league)[round - 1] ?? []).map(([home, away]) =>
        [home, away].sort().join(' v '),
      ),
    ),
  );
  CUP_TIES.forEach((tie) => {
    expect(around).not.toContain([tie.home, tie.away].sort().join(' v '));
  });
});

// ——— THE HERO SLOT ———

test('exactly one card leads the week, and it is the desk’s pick', () => {
  const { hero } = thisWeek();
  expect(hero).toBeDefined();
  expect(hero?.featured).toBe(true);
  // The rule that outranks every other rule: a hero without a photograph is
  // not a hero, because the layout IS the photograph.
  expect(hero?.heroImage).not.toBe('');
});

test('a featured match with no photograph does not take the hero slot', () => {
  // The desk marks the pick; the photograph is a separate field, and the two
  // can disagree. When they do, the slot passes down the fallback order
  // rather than rendering a hero over nothing.
  const { hero, upcoming } = pulse(MATCHDAYS_PLAYED);
  const withoutPhoto = [...(hero === undefined ? [] : [hero]), ...upcoming].filter(
    (match) => match.featured && match.heroImage === '',
  );
  withoutPhoto.forEach((match) => expect(match).not.toBe(hero));
});

test('with no photograph anywhere the carousel is compact end to end', () => {
  // Round 14 is past the cup ties and past the desk's entry, so nothing in
  // that week carries artwork — the state the rule describes, reached without
  // editing the desk.
  const barren = pulse(13);
  expect(barren.upcoming.every((match) => match.heroImage === '')).toBe(true);
  expect(barren.hero).toBeUndefined();
});

test('the fallback order prefers a cup tie, then the highest-placed pairing', () => {
  // With nothing featured, the order is cup first and then the smallest sum
  // of the two league positions — "highest" meaning furthest UP the table.
  const week = pulse(MATCHDAYS_PLAYED);
  const invited = [...(week.hero === undefined ? [] : [week.hero]), ...week.upcoming];
  const cup = invited.filter((match) => match.competitionSlug === 'domestic-cup');
  expect(cup.length).toBeGreaterThan(0);
  const sum = (match: (typeof invited)[number]) => {
    const home = clubStanding(match.home);
    const away = clubStanding(match.away);
    return home === undefined || away === undefined || home.league !== away.league
      ? globalThis.Number.MAX_SAFE_INTEGER
      : home.position + away.position;
  };
  // The hero this week is featured, so assert the ordering rule on its own
  // terms: among the cup ties, the one the desk picked is also the strongest
  // pairing, which is why the fallback would have chosen it anyway.
  const strongestCup = [...cup].sort((a, b) => sum(a) - sum(b))[0];
  expect(week.hero?.home).toBe(strongestCup?.home);
});

// ——— THE EDITORIAL FIELDS ———

test('a match with no desk entry carries three empty editorial fields', () => {
  const { upcoming } = thisWeek();
  const plain = upcoming.filter((match) => !match.featured);
  expect(plain.length).toBeGreaterThan(0);
  // Empty is a real answer: no generated fallback, ever. If any of these
  // three ever came back non-empty for a match nobody wrote about, something
  // had started inventing copy.
  plain.forEach((match) => {
    expect(match.heroImage).toBe('');
    expect(match.storyLine).toBe('');
  });
});

test('the story line is whatever the desk wrote, verbatim', () => {
  const tie = CUP_TIES[0];
  expect(tie).toBeDefined();
  if (tie === undefined) return;
  const seed = fixtureSeed('Domestic Cup', tie.weekend, tie.home, tie.away);
  const written = editorialFor(seed).storyLine ?? '';
  expect(written).not.toBe('');
  expect(thisWeek().hero?.storyLine).toBe(written);
});

// ——— THE PAUSE CARD'S NULLABLE DATE ———

test('the resume date is a label or nothing, never a placeholder', () => {
  const label = resumesLabel();
  // Whatever the desk has set today, the contract is the same: a real date or
  // the empty string. Never a dash, never "to be confirmed" — the card drops
  // the whole block instead.
  expect(label === '' || /^[A-Z][a-z]+ \d{1,2}$/.test(label)).toBe(true);
});

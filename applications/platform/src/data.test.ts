import { Array, Number } from 'effect';
import { expect, test } from 'vite-plus/test';

import {
  POINTS_DRAW,
  POINTS_WIN,
  clubCupRun,
  clubs,
  competitions,
  featuredClubs,
  leagueCompetitions,
  leagueTeams,
  metricSeries,
  standingsFor,
  trending,
} from './data';
import { contenderPhrases } from './page/clubs';
import { clubEurope } from './standings';
import { allTimeBests, attendance, goals } from './stat-tiles';
import {
  MATCHDAYS_PLAYED,
  SCORE_OVERRIDES,
  fixtureSeed,
  leagueRoundCount,
  leagueRounds,
} from './schedule';
import { tickerQuotes } from './ticker';
import { BASE, CLUB_NAMES } from './worker';

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

test.each(LEAGUES)("%s: the home board's goals per matchday add up to the table", (league) => {
  // The board links straight to the standings, so the two have to agree on
  // how much football the league has produced. They didn't: the boards had the
  // First League ahead 210 to 146 while the tables said 147 to 199.
  const board = goals.find((entry) => entry.league === league);
  expect(board).toBeDefined();
  if (!board) return;

  const scored = Number.sumAll(
    clubs.filter((club) => club.league === league).map((club) => club.scored),
  );
  expect(Number.sumAll(board.rounds)).toBe(scored);
  expect(board.rounds).toHaveLength(MATCHDAYS_PLAYED);
});

// How many matches each matchday actually staged, both leagues together —
// four in the eight-club First League, five in the eleven-club Second with
// one club idle. Read off the generated schedule rather than assumed, so the
// divisor below follows the club tables the way everything else here does.
const matchesPerMatchday = (): ReadonlyArray<number> =>
  LEAGUES.map((league) => leagueRounds(league).slice(0, MATCHDAYS_PLAYED)).reduce<
    ReadonlyArray<number>
  >(
    (totals, rounds) => rounds.map((fixtures, index) => (totals[index] ?? 0) + fixtures.length),
    [],
  );

// The board for a matchday, both leagues added together.
const boardTotals = (
  boards: ReadonlyArray<{ readonly rounds: ReadonlyArray<number> }>,
): ReadonlyArray<number> =>
  boards.reduce<ReadonlyArray<number>>(
    (totals, board) => board.rounds.map((value, index) => (totals[index] ?? 0) + value),
    [],
  );

test('the Her Game goals series is the two league boards, matchday by matchday', () => {
  // The chart and the home tiles describe the SAME rounds — one per league,
  // one across both — so the chart is a combination of the boards, never a
  // second opinion. It was one: 323 goals against the boards' 346, and
  // disagreeing round by round even where the totals nearly met. Only the
  // totals were ever checked, and only for the boards, so the chart drifted
  // freely underneath a green suite.
  expect(metricSeries.Goals.values).toEqual(boardTotals(goals));
});

test('the Her Game attendance series is the boards divided by the matches played', () => {
  // Its unit is "fans per match" while the boards are per-round TOTALS, so
  // the two only agree through the fixture count — nine matches a matchday.
  const totals = boardTotals(attendance);
  const matches = matchesPerMatchday();

  expect(metricSeries.Attendance.values).toEqual(
    totals.map((total, index) => Math.round(total / (matches[index] ?? 1))),
  );
});

test('every metric series carries exactly one point per matchday played', () => {
  // The Her Game chart draws one bar per value and labels it with its index,
  // so a series longer than the canon invents matchdays: it used to carry
  // fourteen points and label bars 13 and 14 under a "Matchday 12 of 14"
  // header.
  for (const series of Object.values(metricSeries)) {
    expect(series.values).toHaveLength(MATCHDAYS_PLAYED);
  }
});

test('every hand-authored scoreline lands on a fixture that has been played', () => {
  // An override keyed past the current matchday renders nowhere: every screen
  // gates scores on `round <= MATCHDAYS_PLAYED`. The derby override sat on
  // round 14 for exactly that reason — authored, invisible, and the round-7
  // derby that IS on screen showed the generic hash score instead. Comparing
  // against the seeds the generator itself produces also catches a wrong
  // venue: home and away are part of the seed.
  const playedSeeds = new Set(
    LEAGUES.flatMap((league) =>
      leagueRounds(league)
        .slice(0, MATCHDAYS_PLAYED)
        .flatMap((fixtures, index) =>
          fixtures.map(([home, away]) => fixtureSeed(league, index + 1, home, away)),
        ),
    ),
  );

  for (const seed of Object.keys(SCORE_OVERRIDES)) {
    expect(playedSeeds.has(seed), `${seed} is not a played fixture`).toBe(true);
  }
});

// The cup run on a club profile and the semifinal draw on the Domestic Cup
// page are two views of one bracket, and until now the profile version was
// club-agnostic: every club rendered the same "Semis — Coming up", so Prague
// Raptors (bottom of the league) and Plzeň advertised a semifinal the cup page
// gives to four other clubs. The pairings are the canon — the profiles follow.
test('only the clubs the cup draw names carry a cup run', () => {
  const cup = competitions.find((candidate) => candidate.slug === 'domestic-cup');
  expect(cup?.standings._tag).toBe('TiesStandings');
  if (cup?.standings._tag !== 'TiesStandings') return;

  const semifinalists = cup.standings.rows.flatMap((row) => {
    const match = row.primary.match(/^Semis — (.+) vs (.+)$/);
    return match ? [match[1] ?? '', match[2] ?? ''] : [];
  });
  // Four clubs, or the pairing copy changed shape and the parse above went
  // quietly empty — which would make the comparison vacuously true.
  expect(semifinalists).toHaveLength(4);

  const slugFor = (name: string): string =>
    clubs.find((club) => club.name === name)?.slug ?? `unknown:${name}`;

  expect(Object.keys(clubCupRun).sort()).toEqual(semifinalists.map(slugFor).sort());
});

// The ticker is the one surface that names clubs without reading the table,
// and it had drifted: the tape quoted "FK Pardubice" for a club whose profile,
// standings row and crest all say "Pardubice". The tape resolves names from
// the table now, so only the Worker's copy can drift — it can't import the
// table without pulling every crest PNG into a Worker bundle. This is what
// stands in for that import.
test('the ticker quotes real clubs, under the names the season table gives them', () => {
  for (const quote of tickerQuotes) {
    const club = clubs.find((candidate) => candidate.slug === quote.slug);
    expect(club, `${quote.slug} is not a club`).toBeDefined();
  }

  for (const entry of BASE) {
    const club = clubs.find((candidate) => candidate.slug === entry.slug);
    expect(entry.name, `the worker calls ${entry.slug} "${entry.name}"`).toBe(club?.name);
  }

  // The worker's name table covers the quote list EXACTLY. A missing key is
  // already caught above (the fallback puts the slug where a name belongs), so
  // this is the other direction: a name left behind for a club the tape has
  // stopped quoting. Comparing BASE's slugs to the quotes' would prove nothing —
  // BASE is `tickerQuotes.map(...)`, so that assertion held by construction and
  // read as coverage the pair never had.
  expect(Object.keys(CLUB_NAMES).sort()).toEqual(
    tickerQuotes.map((quote) => quote.slug).sort((left, right) => (left < right ? -1 : 1)),
  );
});

// The clubs hero's tape is the OTHER surface that used to name clubs from
// literals — "Sparta Praha", "Slavia Praha", "Slovan Liberec", "UWCL 2025/26",
// typed inside the function that resolves names from the table three lines
// above. The names went stale-able and the competition line went wrong:
// Liberec plays the Europa Cup. Both halves derive now, and this is what says
// so out loud.
test("the contenders tape names the featured clubs and only the cups they're in", () => {
  for (const entry of featuredClubs) {
    const club = clubs.find((candidate) => candidate.slug === entry.slug);
    expect(club, `${entry.slug} is not a club`).toBeDefined();
    if (!club) continue;
    expect(contenderPhrases, `the tape drops ${club.name}`).toContain(club.name);
  }

  // Every competition the tape advertises is one a featured club actually
  // plays, and every one they play is advertised — the single hardcoded
  // "UWCL" failed the first half, and dropping Liberec's UWEC the second.
  const played = Array.dedupe(
    featuredClubs.flatMap((entry) => {
      const campaign = clubEurope[entry.slug];
      return campaign === undefined ? [] : [campaign.slug.toUpperCase()];
    }),
  );
  expect(played.length).toBeGreaterThan(1);
  const cups = contenderPhrases[contenderPhrases.length - 1] ?? '';
  for (const cup of played) {
    expect(cups, `the tape omits ${cup}`).toContain(cup);
  }
  for (const cup of ['UWCL', 'UWEC']) {
    if (!played.includes(cup)) expect(cups).not.toContain(cup);
  }
});

// Pin ids are the only strings in this app that outlive the render that wrote
// them — they go to localStorage and come back on the next visit. That is why
// they are authored rather than slugified from display copy (renaming a trending
// tile from "FK Pardubice" to "Pardubice" orphaned every pin already saved for
// it), and it is why they cannot collide: two tiles sharing an id would pin and
// unpin as one. The shape check stands in for what slugify used to guarantee —
// no spaces, no accents, nothing empty.
test('every pinnable tile carries its own well-formed id', () => {
  const ids = [
    ...trending.map((entry) => `trending:${entry.id}`),
    ...allTimeBests.map((record) => `best:${record.id}`),
  ];

  expect(Array.dedupe(ids)).toEqual(ids);
  for (const id of ids) {
    expect(id, `${id} is not a usable pin id`).toMatch(/^[a-z]+:[a-z0-9]+(-[a-z0-9]+)*$/);
  }
});

test('every club sits in a league the schedule generator knows', () => {
  for (const club of clubs) {
    expect(leagueTeams(club.league)).toContain(club.name);
  }
});

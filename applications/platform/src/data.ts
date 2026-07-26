// The platform placeholder data layer: the domain types plus the hardcoded
// content and the pure helpers that read it. All mock until the backend lands.

import { Array, Match as M, Option, Order, pipe } from 'effect';

import {
  AppRoute,
  clubRouter,
  clubsRouter,
  competitionsRouter,
  herGameRouter,
  matchesRouter,
  playersRouter,
} from './route';
import { Metric, Screen, ScorerScope } from './model';

import {
  type Club,
  type Competition,
  type CupTie,
  type Edition,
  type MetricSeries,
  type Official,
  type Player,
  type SavedChart,
  type Scorer,
  type StandingsRow,
  type TrendingEntry,
  TableStandings,
  TiesStandings,
} from './domain/entities';

export * from './domain/entities';

import abcBranikLogo from './assets/clubs/AbcBranik.png';
import artisBrnoLogo from './assets/clubs/ArtisBrno.png';
import banikOstravaLogo from './assets/clubs/BanikOstrava.png';
import dynamoBudejoviceLogo from './assets/clubs/DynamoCeskeBudejovice.png';
import hradecKraloveLogo from './assets/clubs/HradecKralove.png';
import lokomotivaBrnoLogo from './assets/clubs/LokomotivaBrno.png';
import pardubiceLogo from './assets/clubs/Pardubice.svg';
import pragueRaptorsLogo from './assets/clubs/PragueRaptors.png';
import sigmaOlomoucLogo from './assets/clubs/SigmaOlomouc.png';
import slaviaPrahaLogo from './assets/clubs/SlaviaPraha.png';
import slovackoLogo from './assets/clubs/Slovacko.png';
import slovanLiberecLogo from './assets/clubs/SlovanLiberec.png';
import spartaPrahaLogo from './assets/clubs/SpartaPraha.png';
import tepliceLogo from './assets/clubs/Teplice.png';
import viktoriaPlzenLogo from './assets/clubs/ViktoriaPlzen.png';
import vysocinaJihlavaLogo from './assets/clubs/VysocinaJihlava.png';
import domesticCupBadge from './assets/competitions/domestic-cup.png';
import firstLeagueBadge from './assets/competitions/first-league.png';
import nationalTeamBadge from './assets/competitions/national-team.png';
import secondLeagueBadge from './assets/competitions/second-league.png';
import uwclBadge from './assets/competitions/uwcl.png';
import uwecBadge from './assets/competitions/uwec.png';
import pardubicePhoto from './assets/trending/pardubice.jpg';
import sierraPhoto from './assets/trending/sierra.jpg';
import spartaPhoto from './assets/trending/sparta.jpg';

export interface NavEntry {
  readonly screen: Screen;
  readonly label: string;
  readonly href: string;
  // HER GAME — the personal section. Always the CENTER tab and visually
  // set apart from the rest (solid pink chip, no number).
  readonly isFeatured?: boolean;
}

// Officials left the top nav (still reachable from the home browse tiles
// and by URL) so HER GAME can hold the center with two sections per side.
export const navEntries: ReadonlyArray<NavEntry> = [
  { screen: 'Clubs', label: 'Clubs', href: clubsRouter() },
  { screen: 'Players', label: 'Players', href: playersRouter() },
  {
    screen: 'HerGame',
    label: 'Her Game',
    href: herGameRouter(),
    isFeatured: true,
  },
  { screen: 'Matches', label: 'Matches', href: matchesRouter() },
  {
    screen: 'Competitions',
    label: 'Competitions',
    href: competitionsRouter(),
  },
];

export const screenTitles: Record<Screen, string> = {
  Welcome: 'Home',
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
// screenView resolving the slug), and NotFound onto the welcome screen (the
// mock has no error page).
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

// ONE POINT PER MATCHDAY PLAYED — the chart’s x axis is the season canon, so
// the series run to MATCHDAYS_PLAYED and no further. They used to carry
// fourteen points each, which drew two bars for matchdays that have not been
// played and labeled them 13 and 14 while every competition screen said
// "Matchday 12 of 14". data.test.ts asserts the length now.
//
// AND THE TWO THAT HAVE A SOURCE ARE COMBINATIONS OF IT, matchday by
// matchday, not a second set of numbers about the same football. The home
// stat tiles publish per-league boards (`goals` and `attendance` in
// stat-tiles.ts, themselves tied to the standings tables); this chart is the
// both-leagues view of the very same rounds, so Goals is their per-matchday
// SUM and Attendance their per-matchday average PER MATCH — nine matches a
// round, four in the eight-club First League and five in the eleven-club
// Second. The old figures agreed with neither: 323 goals against the boards'
// 346, and disagreeing round by round even where the totals came close.
// data.test.ts now recomputes both from the boards, so a board edit fails
// here rather than putting two different seasons on two screens.
export const metricSeries: Record<Metric, MetricSeries> = {
  Goals: {
    label: 'Goals per matchday',
    unit: 'goals across both leagues',
    values: [30, 30, 23, 34, 26, 30, 23, 36, 28, 29, 28, 29],
  },
  Attendance: {
    label: 'Average attendance',
    unit: 'fans per match',
    values: [2227, 2344, 2288, 2511, 2341, 2564, 2410, 2606, 2493, 2644, 2516, 2673],
  },
  Conversion: {
    label: 'Shot conversion',
    unit: 'percent of shots scored',
    values: [9.8, 11.2, 10.1, 12.6, 11.9, 13.4, 12.2, 14.1, 13, 14.8, 13.9, 15.6],
  },
};

// Anyone and ANYTHING can trend (user call) â players, clubs, coaches,
// referees, matches, officials alike. The canonical mock list (user-
// supplied); rendered on the welcome hero’s board AND the dashboard.
// No percentages here (user call) — the rank IS the story; the tape above
// carries the movement numbers.
export const trending: ReadonlyArray<TrendingEntry> = [
  {
    id: 'sierra-pennock',
    name: 'Sierra Pennock',
    kind: 'Player',
    href: playersRouter(),
    crest: '',
    photo: sierraPhoto,
    focus: '50% 22%',
  },
  {
    id: 'sparta-praha',
    name: 'Sparta Praha',
    kind: 'Club',
    href: clubRouter({ slug: 'sparta-praha' }),
    crest: spartaPrahaLogo,
    photo: spartaPhoto,
    focus: '50% 35%',
  },
  {
    id: 'pardubice',
    // The clubs table’s name, not "FK Pardubice" — the tile links to the
    // profile, and the profile, its standings row and the crest rail all say
    // "Pardubice". A trending tile is free-text because anything can trend,
    // so nothing derived this; the ticker quoting the same wrong name is what
    // gave it away.
    name: 'Pardubice',
    kind: 'Club',
    href: clubRouter({ slug: 'pardubice' }),
    crest: pardubiceLogo,
    photo: pardubicePhoto,
    focus: '50% 18%',
  },
];

// THE SEASON CANON. Every league number on every screen comes from this
// table: the standings (played and points are arithmetic on the record —
// see standingsFor), the clubs screen’s form bars, the club profile’s
// statement line, and the round-robin the fixtures are generated from.
// Written as plain literals rather than through a ten-argument factory, so
// a club’s record is readable at the point it is authored.
//
// The records are mock but LEAGUE-CONSISTENT: within a league the wins and
// losses balance (every win is somebody’s defeat), the draw counts sum even
// (a draw is two clubs' draw), the goals scored and conceded sum to the same
// total, and each club’s games add up to the matchdays it has actually
// played — twelve in the First League, and eleven in the Second, where
// eleven clubs mean one club sits out each matchday (Sparta Praha B has
// taken two byes so far, hence its ten).
export const clubs: ReadonlyArray<Club> = [
  // Honors track the ALL-TIME BESTS canon: Sparta holds both records
  // (22× league, 11× cup).
  {
    slug: 'sparta-praha',
    name: 'Sparta Praha',
    city: 'Prague',
    logo: spartaPrahaLogo,
    league: 'First League',
    won: 9,
    drawn: 2,
    lost: 1,
    scored: 31,
    conceded: 9,
    leagueTitles: 22,
    cupTitles: 11,
  },
  {
    slug: 'slavia-praha',
    name: 'Slavia Praha',
    city: 'Prague',
    logo: slaviaPrahaLogo,
    league: 'First League',
    won: 8,
    drawn: 2,
    lost: 2,
    scored: 27,
    conceded: 12,
    leagueTitles: 9,
    cupTitles: 9,
  },
  {
    slug: 'slovacko',
    name: 'Slovácko',
    city: 'Uherské Hradiště',
    logo: slovackoLogo,
    league: 'First League',
    won: 7,
    drawn: 2,
    lost: 3,
    scored: 22,
    conceded: 15,
    leagueTitles: 0,
    cupTitles: 2,
  },
  {
    slug: 'sparta-praha-b',
    name: 'Sparta Praha B',
    city: 'Prague',
    logo: spartaPrahaLogo,
    league: 'Second League',
    won: 7,
    drawn: 2,
    lost: 1,
    scored: 32,
    conceded: 10,
    leagueTitles: 0,
    cupTitles: 0,
  },
  {
    slug: 'vysocina-jihlava',
    name: 'Vysočina Jihlava',
    city: 'Jihlava',
    logo: vysocinaJihlavaLogo,
    league: 'Second League',
    won: 5,
    drawn: 3,
    lost: 3,
    scored: 19,
    conceded: 16,
    leagueTitles: 0,
    cupTitles: 0,
  },
  {
    slug: 'banik-ostrava',
    name: 'Baník Ostrava',
    city: 'Ostrava',
    logo: banikOstravaLogo,
    league: 'First League',
    won: 5,
    drawn: 2,
    lost: 5,
    scored: 17,
    conceded: 18,
    leagueTitles: 2,
    cupTitles: 3,
  },
  {
    slug: 'viktoria-plzen',
    name: 'Viktoria Plzeň',
    city: 'Plzeň',
    logo: viktoriaPlzenLogo,
    league: 'First League',
    won: 2,
    drawn: 3,
    lost: 7,
    scored: 12,
    conceded: 22,
    leagueTitles: 0,
    cupTitles: 1,
  },
  {
    slug: 'slovan-liberec',
    name: 'Slovan Liberec',
    city: 'Liberec',
    logo: slovanLiberecLogo,
    league: 'First League',
    won: 2,
    drawn: 2,
    lost: 8,
    scored: 11,
    conceded: 25,
    leagueTitles: 0,
    cupTitles: 0,
  },
  {
    slug: 'hradec-kralove',
    name: 'Hradec Králové',
    city: 'Hradec Králové',
    logo: hradecKraloveLogo,
    league: 'Second League',
    won: 6,
    drawn: 2,
    lost: 3,
    scored: 24,
    conceded: 13,
    leagueTitles: 0,
    cupTitles: 0,
  },
  {
    slug: 'pardubice',
    name: 'Pardubice',
    city: 'Pardubice',
    logo: pardubiceLogo,
    league: 'Second League',
    won: 5,
    drawn: 2,
    lost: 4,
    scored: 18,
    conceded: 17,
    leagueTitles: 0,
    cupTitles: 0,
  },
  {
    slug: 'sigma-olomouc',
    name: 'Sigma Olomouc',
    city: 'Olomouc',
    logo: sigmaOlomoucLogo,
    league: 'Second League',
    won: 7,
    drawn: 1,
    lost: 3,
    scored: 29,
    conceded: 11,
    leagueTitles: 0,
    cupTitles: 0,
  },
  {
    slug: 'lokomotiva-brno',
    name: 'Lokomotiva Brno',
    city: 'Brno',
    logo: lokomotivaBrnoLogo,
    league: 'First League',
    won: 6,
    drawn: 1,
    lost: 5,
    scored: 19,
    conceded: 17,
    leagueTitles: 0,
    cupTitles: 0,
  },
  {
    slug: 'artis-brno',
    name: 'Artis Brno',
    city: 'Brno',
    logo: artisBrnoLogo,
    league: 'Second League',
    won: 5,
    drawn: 1,
    lost: 5,
    scored: 16,
    conceded: 18,
    leagueTitles: 0,
    cupTitles: 0,
  },
  {
    slug: 'dynamo-ceske-budejovice',
    name: 'Dynamo Č. Budějovice',
    city: 'České Budějovice',
    logo: dynamoBudejoviceLogo,
    league: 'Second League',
    won: 2,
    drawn: 1,
    lost: 8,
    scored: 9,
    conceded: 25,
    leagueTitles: 0,
    cupTitles: 0,
  },
  {
    slug: 'abc-branik',
    name: 'ABC Braník',
    city: 'Prague',
    logo: abcBranikLogo,
    league: 'Second League',
    won: 1,
    drawn: 1,
    lost: 9,
    scored: 7,
    conceded: 31,
    leagueTitles: 0,
    cupTitles: 0,
  },
  {
    slug: 'slovan-liberec-b',
    name: 'Slovan Liberec B',
    city: 'Liberec',
    logo: slovanLiberecLogo,
    league: 'Second League',
    won: 3,
    drawn: 2,
    lost: 6,
    scored: 12,
    conceded: 22,
    leagueTitles: 0,
    cupTitles: 0,
  },
  {
    slug: 'viktoria-plzen-b',
    name: 'Viktoria Plzeň B',
    city: 'Plzeň',
    logo: viktoriaPlzenLogo,
    league: 'Second League',
    won: 6,
    drawn: 2,
    lost: 3,
    scored: 20,
    conceded: 15,
    leagueTitles: 0,
    cupTitles: 0,
  },
  {
    slug: 'prague-raptors',
    name: 'Prague Raptors',
    city: 'Prague',
    logo: pragueRaptorsLogo,
    league: 'First League',
    won: 1,
    drawn: 2,
    lost: 9,
    scored: 8,
    conceded: 29,
    leagueTitles: 0,
    cupTitles: 0,
  },
  {
    slug: 'teplice',
    name: 'Teplice',
    city: 'Teplice',
    logo: tepliceLogo,
    league: 'Second League',
    won: 3,
    drawn: 3,
    lost: 5,
    scored: 13,
    conceded: 21,
    leagueTitles: 0,
    cupTitles: 0,
  },
];

export const players: ReadonlyArray<Player> = [
  {
    name: 'Kateřina Rančová',
    club: 'Sparta Praha',
    position: 'FW',
    appearances: 12,
    goals: 14,
    assists: 5,
  },
  {
    name: 'Adéla Beranová',
    club: 'Slavia Praha',
    position: 'FW',
    appearances: 12,
    goals: 11,
    assists: 3,
  },
  {
    name: 'Tereza Krejzová',
    club: 'Slovácko',
    position: 'MF',
    appearances: 11,
    goals: 7,
    assists: 8,
  },
  {
    name: 'Nikola Fialová',
    club: 'Prague Raptors',
    position: 'MF',
    appearances: 12,
    goals: 6,
    assists: 6,
  },
  {
    name: 'Barbora Klímová',
    club: 'Baník Ostrava',
    position: 'DF',
    appearances: 12,
    goals: 2,
    assists: 4,
  },
  {
    name: 'Eliška Urbanová',
    club: 'Viktoria Plzeň',
    position: 'FW',
    appearances: 10,
    goals: 8,
    assists: 2,
  },
  {
    name: 'Veronika Malá',
    club: 'Pardubice',
    position: 'MF',
    appearances: 12,
    goals: 9,
    assists: 7,
  },
  {
    name: 'Lucie Horáková',
    club: 'Sparta Praha',
    position: 'GK',
    appearances: 12,
    goals: 0,
    assists: 0,
  },
];

export const officials: ReadonlyArray<Official> = [
  { name: 'Martina Šimková', matches: 86, cardsPerMatch: '3.2' },
  { name: 'Jana Adámková', matches: 74, cardsPerMatch: '2.8' },
  { name: 'Petra Novotná', matches: 61, cardsPerMatch: '3.6' },
  { name: 'Lenka Říhová', matches: 55, cardsPerMatch: '2.4' },
  { name: 'Hana Doležalová', matches: 42, cardsPerMatch: '3.9' },
  { name: 'Alena Konečná', matches: 31, cardsPerMatch: '2.1' },
];

// Current state of a competition, shown on its profile page: either a
// league table or a list of ties/participations (cups and Europe).

// One season’s running of a competition. `detail` is the one-liner the
// archive shows — the champion for finished editions, the stage for the
// current one.

export const edition = (label: string, isCurrent: boolean, detail: string): Edition => ({
  label,
  isCurrent,
  detail,
});

export const competitions: ReadonlyArray<Competition> = [
  {
    slug: 'first-league',
    editions: [
      edition('2025/26', true, 'Matchday 12 of 14'),
      edition('2024/25', false, 'Champions: Sparta Praha'),
      edition('2023/24', false, 'Champions: Sparta Praha'),
      edition('2022/23', false, 'Champions: Slavia Praha'),
      edition('2021/22', false, 'Champions: Slavia Praha'),
    ],
    name: 'First League',
    badge: firstLeagueBadge,
    stage: 'Matchday 12 of 14',
    progress: 86,
    tagline: 'The top flight of Czech women’s football',
    // The European line states the bands `zoneFor` actually paints in the
    // table this rule sits above — 1–2 UWCL, 3 UWEC — not the
    // champion/runner-up split it used to claim.
    //
    // NOT `clubEurope`, which an earlier version of this note wrongly cited as
    // agreeing: that map is LAST season’s qualification, so it has Liberec
    // (7th now) in the UWEC and nothing for Slovácko, who currently hold the
    // third-place band. The two are different seasons on purpose — this
    // year’s bands pay out next year.
    format: [
      'Eight clubs, everyone plays everyone home and away — 14 rounds.',
      'The top two enter UWCL qualifying; third gets the Europa Cup path.',
      'The bottom club faces a relegation playoff against the Second League winner.',
    ],
    history: [
      { value: '22', label: 'Titles for Sparta Praha, the record' },
      { value: '30', label: 'Seasons played since the league formed' },
      { value: '412', label: 'Goals scored last season' },
    ],
    standings: TableStandings.make({ league: 'First League' }),
  },
  {
    slug: 'second-league',
    editions: [
      edition('2025/26', true, 'Matchday 12 of 22'),
      edition('2024/25', false, 'Champions: Baník Ostrava'),
      edition('2023/24', false, 'Champions: Prague Raptors'),
      edition('2022/23', false, 'Champions: Lokomotiva Brno'),
    ],
    name: 'Second League',
    badge: secondLeagueBadge,
    stage: 'Matchday 12 of 22',
    progress: 55,
    tagline: 'The second tier — the road up',
    format: [
      'Eleven clubs, home and away — 22 rounds, one club idle each matchday.',
      'The winner meets the First League’s bottom club in a playoff for the top flight.',
      'No relegation pressure — the league is the country’s proving ground.',
    ],
    history: [
      { value: '12', label: 'Clubs promoted since the format began' },
      { value: '18', label: 'Average age of last season’s champions' },
      { value: '368', label: 'Goals scored last season' },
    ],
    standings: TableStandings.make({ league: 'Second League' }),
  },
  {
    slug: 'domestic-cup',
    editions: [
      edition('2025/26', true, 'Semifinals'),
      edition('2024/25', false, 'Winners: Sparta Praha'),
      edition('2023/24', false, 'Winners: Slavia Praha'),
      edition('2022/23', false, 'Winners: Slavia Praha'),
    ],
    name: 'Domestic Cup',
    badge: domesticCupBadge,
    stage: 'Semis',
    progress: 75,
    tagline: 'Knockout football — anyone can win it',
    format: [
      'Straight knockout, single-leg ties — no second chances.',
      'Clubs from both leagues enter; lower-league sides host when drawn together.',
      'The winner books a Europa Cup spot regardless of league position.',
    ],
    history: [
      { value: '11', label: 'Different winners in the cup’s history' },
      { value: '11', label: 'Titles for Sparta Praha, the record' },
      { value: '3', label: 'Finals decided on penalties' },
    ],
    standings: TiesStandings.make({
      rows: [
        { primary: 'Semis — Sparta Praha vs Slovácko', secondary: 'Apr 12' },
        { primary: 'Semis — Slavia Praha vs Baník Ostrava', secondary: 'Apr 13' },
        { primary: 'Finals — Prague, Letná', secondary: 'May 8' },
      ],
    }),
  },
  {
    slug: 'uwcl',
    editions: [
      edition('2025/26', true, 'League phase — MD 3 of 6'),
      edition('2024/25', false, 'Winners: Arsenal'),
      edition('2023/24', false, 'Winners: Barcelona'),
    ],
    name: 'UWCL',
    badge: uwclBadge,
    stage: 'League phase — MD 3 of 6',
    progress: 50,
    tagline: 'UEFA Women’s Champions League',
    format: [
      'Champions and top clubs from across Europe enter through qualifying rounds.',
      'An 18-team league phase replaced the groups — six matches, one table.',
      'The top eight go to the knockouts; the final is a single match at a neutral venue.',
    ],
    history: [
      { value: '2', label: 'UWCL semifinals reached by Czech clubs' },
      { value: '9', label: 'Czech UWCL campaigns so far' },
      { value: '23', label: 'European nights played in Prague' },
    ],
    standings: TiesStandings.make({
      rows: [
        { primary: 'Slavia Praha — League phase', secondary: '9th — Matchday 3 of 6' },
        { primary: 'Sparta Praha — League phase', secondary: '12th — Matchday 3 of 6' },
      ],
    }),
  },
  {
    slug: 'uwec',
    editions: [
      edition('2025/26', true, 'Quarterfinals'),
      edition('2024/25', false, 'Winners: AS Roma'),
    ],
    name: 'UWEC',
    badge: uwecBadge,
    stage: 'Quarters',
    progress: 62,
    tagline: 'UEFA Women’s Europa Cup',
    format: [
      'Europe’s second competition — runners-up and cup winners enter here.',
      'A twelve-team league phase feeds two-leg knockout rounds from the quarters.',
      'UWCL qualifying losers drop in, keeping every round dangerous.',
    ],
    history: [
      { value: '1', label: 'Semifinal reached by a Czech club' },
      { value: '4', label: 'Czech campaigns in the competition' },
      { value: '12', label: 'Wins on European away trips' },
    ],
    standings: TiesStandings.make({
      rows: [{ primary: 'Slovan Liberec — Quarters vs Young Boys', secondary: 'First leg Mar 18' }],
    }),
  },
  {
    slug: 'national-team',
    editions: [
      edition('2026/27', true, 'World Cup qualifying — play-offs'),
      edition('2025', false, 'Nations League B — group winners'),
      edition('2024', false, 'EURO qualifying — League B'),
    ],
    name: 'National Team',
    badge: nationalTeamBadge,
    stage: 'Nations League — MD 4 of 6',
    progress: 66,
    tagline: 'UEFA Women’s Nations League',
    format: [
      'Europe’s national teams split into tiered leagues — League A down to League C.',
      'Home-and-away group games, with promotion and relegation between the tiers.',
      'Results feed into EURO and World Cup qualifying — every night counts.',
    ],
    history: [
      { value: '25', label: 'Lvice called up for the last camp' },
      { value: '9', label: 'International matches a year we cover' },
      { value: '4', label: 'Qualifying campaigns on our feeds' },
    ],
    standings: TiesStandings.make({
      rows: [
        { primary: 'League B — Group stage', secondary: 'Matchday 4 of 6' },
        { primary: 'Promotion playoff', secondary: 'To be confirmed' },
      ],
    }),
  },
];

// The competition a slug names, if any — the one lookup the matches screen
// and the round clamp share.
export const competitionBySlug = (slug: string): Option.Option<Competition> =>
  Array.findFirst(competitions, (competition) => competition.slug === slug);

// The competitions with a league season behind them — a table and a
// round-robin, so a round pager means something. Derived rather than a list of
// slugs, so /matches shows every league the canon has instead of the two it
// used to name in the view.
export const leagueCompetitions: ReadonlyArray<Competition> = competitions.filter(
  (competition) => competition.standings._tag === 'TableStandings',
);

// Standings + cup-run + top-scorer mock, migrated from the landing page’s
// profile pages. Replace with API data when it exists.

export const POINTS_WIN = 3;
export const POINTS_DRAW = 1;

// Biggest first — league tables rank downwards on every column they sort by.
const descendingBy = (key: (row: StandingsRow) => number): Order.Order<StandingsRow> =>
  Order.mapInput(Order.Number, (row: StandingsRow) => -key(row));

// A league’s clubs in AUTHORING order — the seeding the round-robin
// generator pairs off (see leagueRounds). Deliberately not the table order:
// a club climbing the standings must not reshuffle the season’s fixtures.
export const leagueTeams = (league: string): ReadonlyArray<string> =>
  clubs.filter((club) => club.league === league).map((club) => club.name);

// The standings table backing a league, COMPUTED from the club records
// above: played and points are arithmetic, so the table can’t drift from the
// form bars, and a hand-typed points column can’t quietly exceed what the
// fixtures allow (the old one did — 170 points across eight clubs when
// fourteen rounds can only pay out 168).
export const standingsFor = (league: string): ReadonlyArray<StandingsRow> =>
  pipe(
    clubs.filter((club) => club.league === league),
    Array.map(
      (club): StandingsRow => ({
        team: club.name,
        played: club.won + club.drawn + club.lost,
        scored: club.scored,
        conceded: club.conceded,
        points: club.won * POINTS_WIN + club.drawn * POINTS_DRAW,
      }),
    ),
    // Points, then goal difference, then goals scored — how every league
    // table in the country is ordered.
    Array.sortBy(
      descendingBy((row) => row.points),
      descendingBy((row) => row.scored - row.conceded),
      descendingBy((row) => row.scored),
    ),
  );

// EUROPEAN CONTENDERS (clubs screen) — the featured-club carousel entries.
// Lives here (not in the view) so `update` can wrap SelectedFeaturedClub
// against the list’s length.
export type FeaturedClub = Readonly<{
  slug: string;
  // The Universe-style kicker line above the name.
  epithet: string;
  // '' until the user supplies the artwork — the crest carries the slot.
  photo: string;
  focus: string;
}>;

export const featuredClubs: ReadonlyArray<FeaturedClub> = [
  { slug: 'sparta-praha', epithet: 'The record champions', photo: spartaPhoto, focus: '50% 30%' },
  { slug: 'slavia-praha', epithet: 'The eternal rivals', photo: '', focus: '50% 30%' },
  { slug: 'slovan-liberec', epithet: 'The pride of the north', photo: '', focus: '50% 30%' },
];

// THE FOUR CLUBS STILL IN THE CUP, each with the run that got them there.
// This was one club-agnostic list rendered on every profile, so Prague
// Raptors — bottom of the league — and Plzeň both advertised a semifinal that
// the Domestic Cup page, two clicks away, gives to Sparta, Slovácko, Slavia
// and Baník. A profile is where a reader checks a club’s season; it cannot be
// the one page that invents one.
//
// Hand-authored because the cup canon only publishes the semifinal PAIRINGS,
// not each club’s earlier rounds — so data.test.ts ties these keys back to the
// clubs those pairings name, and a change to either side fails there.
export const clubCupRun: Record<string, ReadonlyArray<CupTie>> = {
  'sparta-praha': [
    { round: 'Round of 16', result: 'Won 6:0', isUpcoming: false },
    { round: 'Quarters', result: 'Won 3:1', isUpcoming: false },
    { round: 'Semis', result: 'Coming up', isUpcoming: true },
  ],
  slovacko: [
    { round: 'Round of 16', result: 'Won 2:1', isUpcoming: false },
    { round: 'Quarters', result: 'Won 1:0 (aet)', isUpcoming: false },
    { round: 'Semis', result: 'Coming up', isUpcoming: true },
  ],
  'slavia-praha': [
    { round: 'Round of 16', result: 'Won 4:0', isUpcoming: false },
    { round: 'Quarters', result: 'Won 2:0', isUpcoming: false },
    { round: 'Semis', result: 'Coming up', isUpcoming: true },
  ],
  'banik-ostrava': [
    { round: 'Round of 16', result: 'Won 3:2', isUpcoming: false },
    { round: 'Quarters', result: 'Won 4:3 (pens)', isUpcoming: false },
    { round: 'Semis', result: 'Coming up', isUpcoming: true },
  ],
};

// Deterministic per-club placeholder scorers, so every profile shows stable
// but obviously replaceable content.
export const scorerPool: ReadonlyArray<string> = [
  'Adéla Novotná',
  'Karolína Dvořáková',
  'Tereza Svobodová',
  'Lucie Králová',
  'Eliška Procházková',
  'Veronika Marešová',
  'Barbora Šimková',
  'Natálie Horáková',
];

export const hashSlug = (slug: string): number =>
  Math.abs(Array.reduce([...slug], 0, (hash, char) => (hash * 31 + char.charCodeAt(0)) | 0));

// Top three per scope, goals strictly descending; Sparta’s all-comps
// leader is the canonical Rancová.
export const scorersFor = (target: Club, scope: ScorerScope): ReadonlyArray<Scorer> => {
  const seed = hashSlug(`${scope}:${target.slug}`);
  // A league tally can’t exceed what the club scored in the league (the
  // table’s own number); the cup and all-comps ceilings sit above it because
  // those goals aren’t in the table.
  const ceiling = scope === 'Cup' ? 6 : scope === 'League' ? Math.min(13, target.scored) : 17;
  const generated = [0, 1, 2].map((rank) => ({
    name: scorerPool[(seed + rank * 5) % scorerPool.length] ?? '—',
    goals: Math.max(1, ceiling - (seed % 3) - rank * (2 + (seed % 2))),
  }));
  if (target.slug === 'sparta-praha' && scope === 'All') {
    return [{ name: 'Denisa Rancová', goals: 17 }, ...generated.slice(1)];
  }
  return generated;
};

export const savedCharts: ReadonlyArray<SavedChart> = [
  {
    id: 'chart:goals-vs-xg-sparta',
    title: 'Goals vs xG — Sparta Praha',
    updated: 'Updated 2 days ago',
    spark: [3, 5, 4, 7, 6, 9, 8, 11],
  },
  {
    id: 'chart:attendance-first-league',
    title: 'Attendance growth — First League',
    updated: 'Updated 5 days ago',
    spark: [2, 3, 5, 4, 6, 8, 9, 12],
  },
  {
    id: 'chart:rancova-shots-per-90',
    title: 'Rančová — shots per 90',
    updated: 'Updated 1 week ago',
    spark: [6, 4, 7, 8, 5, 9, 10, 9],
  },
  {
    id: 'chart:cards-per-referee',
    title: 'Cards per referee — season',
    updated: 'Updated 2 weeks ago',
    spark: [8, 7, 9, 6, 7, 5, 6, 4],
  },
];

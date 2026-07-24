// The platform placeholder data layer: the domain types plus the hardcoded
// content and the pure helpers that read it. All mock until the backend lands.

import { Array, Match as M } from 'effect';

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
  // The bottom tab bar's label — five tabs on a phone leave no room for
  // long labels. Home is not a tab: the brand wordmark is the way home.
  readonly short: string;
  readonly href: string;
  // HER GAME — the personal section. Always the CENTER tab and visually
  // set apart from the rest (solid pink chip, no number).
  readonly isFeatured?: boolean;
}

// Officials left the top nav (still reachable from the home browse tiles
// and by URL) so HER GAME can hold the center with two sections per side.
export const navEntries: ReadonlyArray<NavEntry> = [
  { screen: 'Clubs', label: 'Clubs', short: 'Clubs', href: clubsRouter() },
  { screen: 'Players', label: 'Players', short: 'Players', href: playersRouter() },
  {
    screen: 'HerGame',
    label: 'Her Game',
    short: 'Her Game',
    href: herGameRouter(),
    isFeatured: true,
  },
  { screen: 'Matches', label: 'Matches', short: 'Matches', href: matchesRouter() },
  {
    screen: 'Competitions',
    label: 'Competitions',
    short: 'Competitions',
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

export interface MetricSeries {
  readonly label: string;
  readonly unit: string;
  readonly values: ReadonlyArray<number>;
}

export const metricSeries: Record<Metric, MetricSeries> = {
  Goals: {
    label: 'Goals per matchday',
    unit: 'goals across both leagues',
    values: [19, 26, 22, 31, 24, 28, 35, 23, 27, 30, 25, 33, 29, 36],
  },
  Attendance: {
    label: 'Average attendance',
    unit: 'fans per match',
    values: [640, 720, 690, 810, 760, 900, 840, 880, 930, 1010, 970, 1120, 1080, 1240],
  },
  Conversion: {
    label: 'Shot conversion',
    unit: 'percent of shots scored',
    values: [9.8, 11.2, 10.1, 12.6, 11.9, 13.4, 12.2, 14.1, 13, 14.8, 13.9, 15.6, 14.7, 16.2],
  },
};

export interface TrendingEntry {
  readonly name: string;
  readonly kind: string;
  // Where the row leads — every trending row is a door into the data.
  readonly href: string;
  // Club rows carry their crest; '' renders the person's initials instead.
  readonly crest: string;
  // A featured tile background ('' = plain paper card). Photo tiles go
  // dark: cover image + ink gradient, type flips to paper. `focus` is the
  // cover crop's object-position — where the subject's face lives.
  readonly photo: string;
  readonly focus: string;
}

// Anyone and ANYTHING can trend (user call) â players, clubs, coaches,
// referees, matches, officials alike. The canonical mock list (user-
// supplied); rendered on the welcome hero's board AND the dashboard.
// No percentages here (user call) — the rank IS the story; the tape above
// carries the movement numbers.
export const trending: ReadonlyArray<TrendingEntry> = [
  {
    name: 'Sierra Pennock',
    kind: 'Player',
    href: playersRouter(),
    crest: '',
    photo: sierraPhoto,
    focus: '50% 22%',
  },
  {
    name: 'Sparta Praha',
    kind: 'Club',
    href: clubRouter({ slug: 'sparta-praha' }),
    crest: spartaPrahaLogo,
    photo: spartaPhoto,
    focus: '50% 35%',
  },
  {
    name: 'FK Pardubice',
    kind: 'Club',
    href: clubRouter({ slug: 'pardubice' }),
    crest: pardubiceLogo,
    photo: pardubicePhoto,
    focus: '50% 18%',
  },
];

export interface Club {
  readonly slug: string;
  readonly name: string;
  readonly city: string;
  readonly logo: string;
  readonly league: string;
  readonly won: number;
  readonly drawn: number;
  readonly lost: number;
  // Honors counts, migrated from the landing page's profile mock —
  // placeholder until the real data lands.
  readonly leagueTitles: number;
  readonly cupTitles: number;
}

export const club = (
  slug: string,
  name: string,
  city: string,
  logo: string,
  league: string,
  won: number,
  drawn: number,
  lost: number,
  leagueTitles: number,
  cupTitles: number,
): Club => ({ slug, name, city, logo, league, won, drawn, lost, leagueTitles, cupTitles });

export const clubs: ReadonlyArray<Club> = [
  // Honors track the ALL-TIME BESTS canon: Sparta holds both records
  // (22× league, 11× cup).
  club('sparta-praha', 'Sparta Praha', 'Prague', spartaPrahaLogo, 'First League', 10, 1, 1, 22, 11),
  club('slavia-praha', 'Slavia Praha', 'Prague', slaviaPrahaLogo, 'First League', 9, 2, 1, 9, 9),
  club('slovacko', 'Slovácko', 'Uherské Hradiště', slovackoLogo, 'First League', 7, 3, 2, 0, 2),
  club(
    'sparta-praha-b',
    'Sparta Praha B',
    'Prague',
    spartaPrahaLogo,
    'Second League',
    9,
    1,
    2,
    0,
    0,
  ),
  club(
    'vysocina-jihlava',
    'Vysočina Jihlava',
    'Jihlava',
    vysocinaJihlavaLogo,
    'Second League',
    6,
    2,
    4,
    0,
    0,
  ),
  club(
    'banik-ostrava',
    'Baník Ostrava',
    'Ostrava',
    banikOstravaLogo,
    'First League',
    5,
    3,
    4,
    2,
    3,
  ),
  club(
    'viktoria-plzen',
    'Viktoria Plzeň',
    'Plzeň',
    viktoriaPlzenLogo,
    'First League',
    4,
    3,
    5,
    0,
    1,
  ),
  club(
    'slovan-liberec',
    'Slovan Liberec',
    'Liberec',
    slovanLiberecLogo,
    'First League',
    3,
    2,
    7,
    0,
    0,
  ),
  club(
    'hradec-kralove',
    'Hradec Králové',
    'Hradec Králové',
    hradecKraloveLogo,
    'Second League',
    1,
    2,
    9,
    0,
    0,
  ),
  club('pardubice', 'Pardubice', 'Pardubice', pardubiceLogo, 'Second League', 9, 2, 1, 0, 0),
  club(
    'sigma-olomouc',
    'Sigma Olomouc',
    'Olomouc',
    sigmaOlomoucLogo,
    'Second League',
    8,
    1,
    3,
    0,
    0,
  ),
  club(
    'lokomotiva-brno',
    'Lokomotiva Brno',
    'Brno',
    lokomotivaBrnoLogo,
    'First League',
    7,
    2,
    3,
    0,
    0,
  ),
  club('artis-brno', 'Artis Brno', 'Brno', artisBrnoLogo, 'Second League', 6, 3, 3, 0, 0),
  club(
    'dynamo-ceske-budejovice',
    'Dynamo Č. Budějovice',
    'České Budějovice',
    dynamoBudejoviceLogo,
    'Second League',
    5,
    2,
    5,
    0,
    0,
  ),
  club('abc-branik', 'ABC Braník', 'Prague', abcBranikLogo, 'Second League', 1, 1, 10, 0, 0),
  club(
    'slovan-liberec-b',
    'Slovan Liberec B',
    'Liberec',
    slovanLiberecLogo,
    'Second League',
    4,
    2,
    6,
    0,
    0,
  ),
  club(
    'viktoria-plzen-b',
    'Viktoria Plzeň B',
    'Plzeň',
    viktoriaPlzenLogo,
    'Second League',
    5,
    3,
    4,
    0,
    0,
  ),
  club(
    'prague-raptors',
    'Prague Raptors',
    'Prague',
    pragueRaptorsLogo,
    'First League',
    2,
    3,
    7,
    0,
    0,
  ),
  club('teplice', 'Teplice', 'Teplice', tepliceLogo, 'Second League', 1, 1, 10, 0, 0),
];

export interface Player {
  readonly name: string;
  readonly club: string;
  readonly position: string;
  readonly appearances: number;
  readonly goals: number;
  readonly assists: number;
}

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

export interface Official {
  readonly name: string;
  readonly matches: number;
  readonly cardsPerMatch: string;
}

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
export interface CompetitionTie {
  readonly primary: string;
  readonly secondary: string;
}

export type CompetitionStandings =
  | { readonly kind: 'table'; readonly league: string }
  | { readonly kind: 'ties'; readonly rows: ReadonlyArray<CompetitionTie> };

// One season's running of a competition. `detail` is the one-liner the
// archive shows — the champion for finished editions, the stage for the
// current one.
export interface Edition {
  readonly label: string;
  readonly isCurrent: boolean;
  readonly detail: string;
}

export const edition = (label: string, isCurrent: boolean, detail: string): Edition => ({
  label,
  isCurrent,
  detail,
});

export interface Competition {
  readonly slug: string;
  readonly name: string;
  readonly badge: string;
  readonly stage: string;
  readonly progress: number;
  readonly tagline: string;
  // Newest first; exactly one edition is `current`.
  readonly editions: ReadonlyArray<Edition>;
  // The format explainer, one rule per line. Placeholder — verify against
  // the real regulations before publishing.
  readonly format: ReadonlyArray<string>;
  // History stats for the profile page. Placeholder.
  readonly history: ReadonlyArray<{ readonly value: string; readonly label: string }>;
  readonly standings: CompetitionStandings;
}

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
    format: [
      'Eight clubs, everyone plays everyone home and away — 14 rounds.',
      'The champion enters UWCL qualifying; the runner-up gets the Europa Cup path.',
      'The bottom club faces a relegation playoff against the Second League winner.',
    ],
    history: [
      { value: '14', label: 'Titles for Sparta Praha, the record' },
      { value: '30', label: 'Seasons played since the league formed' },
      { value: '412', label: 'Goals scored last season' },
    ],
    standings: { kind: 'table', league: 'First League' },
  },
  {
    slug: 'second-league',
    editions: [
      edition('2025/26', true, 'Matchday 12 of 14'),
      edition('2024/25', false, 'Champions: Baník Ostrava'),
      edition('2023/24', false, 'Champions: Prague Raptors'),
      edition('2022/23', false, 'Champions: Lokomotiva Brno'),
    ],
    name: 'Second League',
    badge: secondLeagueBadge,
    stage: 'Matchday 12 of 14',
    progress: 86,
    tagline: 'The second tier — the road up',
    format: [
      'Eight clubs, home and away — 14 rounds of promotion fights.',
      'The winner meets the First League’s bottom club in a playoff for the top flight.',
      'No relegation pressure — the league is the country’s proving ground.',
    ],
    history: [
      { value: '12', label: 'Clubs promoted since the format began' },
      { value: '18', label: 'Average age of last season’s champions' },
      { value: '368', label: 'Goals scored last season' },
    ],
    standings: { kind: 'table', league: 'Second League' },
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
      { value: '5', label: 'Titles for Sparta Praha, the record' },
      { value: '3', label: 'Finals decided on penalties' },
    ],
    standings: {
      kind: 'ties',
      rows: [
        { primary: 'Semis — Sparta Praha vs Slovácko', secondary: 'Apr 12' },
        { primary: 'Semis — Slavia Praha vs Baník Ostrava', secondary: 'Apr 13' },
        { primary: 'Finals — Prague, Letná', secondary: 'May 8' },
      ],
    },
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
    standings: {
      kind: 'ties',
      rows: [
        { primary: 'Slavia Praha — League phase', secondary: '9th — Matchday 3 of 6' },
        { primary: 'Sparta Praha — League phase', secondary: '12th — Matchday 3 of 6' },
      ],
    },
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
    standings: {
      kind: 'ties',
      rows: [{ primary: 'Sparta Praha — Quarters vs Young Boys', secondary: 'First leg Mar 18' }],
    },
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
    standings: {
      kind: 'ties',
      rows: [
        { primary: 'League B — Group stage', secondary: 'Matchday 4 of 6' },
        { primary: 'Promotion playoff', secondary: 'To be confirmed' },
      ],
    },
  },
];

// Standings + cup-run + top-scorer mock, migrated from the landing page's
// profile pages. Replace with API data when it exists.

export interface StandingsRow {
  readonly team: string;
  readonly played: number;
  readonly scored: number;
  readonly conceded: number;
  readonly points: number;
}

// Goal records are mock, but they add up: within a league the scored and
// conceded columns sum to the same total (every goal is someone else's
// concession) and goal difference falls monotonically with the table, so
// nothing reads as impossible next to the points.
export const firstLeagueStandings: ReadonlyArray<StandingsRow> = [
  { team: 'Sparta Praha', played: 14, scored: 42, conceded: 9, points: 36 },
  { team: 'Slavia Praha', played: 14, scored: 38, conceded: 12, points: 33 },
  { team: 'Baník Ostrava', played: 14, scored: 29, conceded: 17, points: 27 },
  { team: 'Slovácko', played: 14, scored: 24, conceded: 20, points: 23 },
  { team: 'Viktoria Plzeň', played: 14, scored: 21, conceded: 24, points: 19 },
  { team: 'Lokomotiva Brno', played: 14, scored: 17, conceded: 30, points: 15 },
  { team: 'Slovan Liberec', played: 14, scored: 13, conceded: 36, points: 11 },
  { team: 'Prague Raptors', played: 14, scored: 8, conceded: 44, points: 6 },
];

export const secondLeagueStandings: ReadonlyArray<StandingsRow> = [
  { team: 'Sparta Praha B', played: 14, scored: 42, conceded: 13, points: 34 },
  { team: 'Sigma Olomouc', played: 14, scored: 37, conceded: 15, points: 30 },
  { team: 'Hradec Králové', played: 14, scored: 33, conceded: 17, points: 27 },
  { team: 'Viktoria Plzeň B', played: 14, scored: 30, conceded: 19, points: 24 },
  { team: 'Pardubice', played: 14, scored: 27, conceded: 21, points: 22 },
  { team: 'Vysočina Jihlava', played: 14, scored: 24, conceded: 23, points: 19 },
  { team: 'Artis Brno', played: 14, scored: 21, conceded: 26, points: 17 },
  { team: 'Slovan Liberec B', played: 14, scored: 17, conceded: 29, points: 13 },
  { team: 'Teplice', played: 14, scored: 14, conceded: 31, points: 10 },
  { team: 'Dynamo Č. Budějovice', played: 14, scored: 12, conceded: 34, points: 8 },
  { team: 'ABC Braník', played: 14, scored: 8, conceded: 37, points: 4 },
];

export interface CupTie {
  readonly round: string;
  readonly result: string;
  readonly isUpcoming: boolean;
}

export const cupRun: ReadonlyArray<CupTie> = [
  { round: 'Round of 16', result: 'Won 3:0', isUpcoming: false },
  { round: 'Quarters', result: 'Won 2:1', isUpcoming: false },
  { round: 'Semis', result: 'Coming up', isUpcoming: true },
];

export interface Scorer {
  readonly name: string;
  readonly goals: number;
}

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

// Top three per scope, goals strictly descending; Sparta's all-comps
// leader is the canonical Rancová.
export const scorersFor = (target: Club, scope: ScorerScope): ReadonlyArray<Scorer> => {
  const seed = hashSlug(`${scope}:${target.slug}`);
  const ceiling = scope === 'Cup' ? 6 : scope === 'League' ? 13 : 17;
  const generated = [0, 1, 2].map((rank) => ({
    name: scorerPool[(seed + rank * 5) % scorerPool.length] ?? '—',
    goals: Math.max(1, ceiling - (seed % 3) - rank * (2 + (seed % 2))),
  }));
  if (target.slug === 'sparta-praha' && scope === 'All') {
    return [{ name: 'Denisa Rancová', goals: 17 }, ...generated.slice(1)];
  }
  return generated;
};

export interface SavedChart {
  // Stable pin id (`chart:<slug>`), so a pin survives a title edit.
  readonly id: string;
  readonly title: string;
  readonly updated: string;
  readonly spark: ReadonlyArray<number>;
}

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

// How many league rounds each division plays in a season — eight First
// League clubs meet three times (21), eleven Second League clubs twice (20).
export const leagueRounds: Record<string, number> = {
  'First League': 21,
  'Second League': 20,
};
